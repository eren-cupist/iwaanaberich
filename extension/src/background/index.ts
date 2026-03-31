import { getTokens, isTradingActive, setTradingActive } from "../lib/storage";

const API_BASE = "http://localhost:4000";
const ALARM_TRADING = "trading-analysis";
const ALARM_DAILY_PNL = "daily-pnl-snapshot";

// 알람 핸들러
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_TRADING) {
    await runTradingCycle();
  }

  if (alarm.name === ALARM_DAILY_PNL) {
    await takeDailySnapshot();
  }
});

// 트레이딩 분석 사이클
async function runTradingCycle() {
  const active = await isTradingActive();
  if (!active) return;

  const tokens = await getTokens();
  if (!tokens) {
    console.error("[이와나베리치] 로그인 필요 - 트레이딩 중지");
    await stopTrading();
    return;
  }

  try {
    // 트레이딩 설정에서 대상 마켓 조회
    const configResponse = await fetch(`${API_BASE}/trading-config`, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });

    if (!configResponse.ok) return;
    const config = await configResponse.json();

    if (!config || !config.targetMarkets || config.targetMarkets.length === 0) {
      console.log("[이와나베리치] 대상 마켓이 설정되지 않았습니다.");
      return;
    }

    // 각 마켓에 대해 분석 실행
    for (const market of config.targetMarkets) {
      try {
        const response = await fetch(`${API_BASE}/trading/analyze`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ market }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`[이와나베리치] ${market} 분석 완료:`, result.status);

          // AI 에러 시 자동매매 종료
          if (result.status === "ai_error") {
            console.error(`[이와나베리치] AI 분석 에러 (${result.aiErrorType}): ${result.reason}`);
            chrome.notifications.create({
              type: "basic",
              iconUrl: "icons/icon128.png",
              title: "자동매매 중지됨",
              message: `AI 분석 실패로 자동매매가 중지되었습니다. (${result.aiErrorType === "AUTH_FAILED" ? "API 키 만료/무효" : result.aiErrorType === "RATE_LIMITED" ? "요청 한도 초과" : "AI 서비스 오류"})`,
            });
            chrome.runtime.sendMessage({ type: "TRADING_STOPPED_BY_ERROR", reason: result.reason }).catch(() => {});
            await stopTrading();
            return;
          }

          // 거래 발생 시 알림 + 팝업 refetch
          if (result.status === "traded") {
            chrome.notifications.create({
              type: "basic",
              iconUrl: "icons/icon128.png",
              title: "자동매매 체결",
              message: `${market}: ${result.analysis.decision} (신뢰도: ${result.analysis.confidence}%)`,
            });
            chrome.runtime.sendMessage({ type: "TRADE_EXECUTED" }).catch(() => {});
          }
        } else if (response.status >= 500) {
          // 서버 에러 시에도 자동매매 종료
          console.error(`[이와나베리치] ${market} 서버 에러 (${response.status})`);
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon128.png",
            title: "자동매매 중지됨",
            message: `서버 오류(${response.status})로 자동매매가 중지되었습니다.`,
          });
          chrome.runtime.sendMessage({ type: "TRADING_STOPPED_BY_ERROR", reason: `서버 오류 ${response.status}` }).catch(() => {});
          await stopTrading();
          return;
        }
      } catch (error) {
        console.error(`[이와나베리치] ${market} 분석 실패:`, error);
      }
    }

    // 뱃지 업데이트
    updateBadge();
  } catch (error) {
    console.error("[이와나베리치] 트레이딩 사이클 오류:", error);
  }
}

// 일일 스냅샷
async function takeDailySnapshot() {
  const tokens = await getTokens();
  if (!tokens) return;

  try {
    await fetch(`${API_BASE}/profit-loss/snapshot`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });
    console.log("[이와나베리치] 일일 스냅샷 완료");
  } catch (error) {
    console.error("[이와나베리치] 일일 스냅샷 실패:", error);
  }
}

// 트레이딩 시작
async function startTrading(intervalMin: number = 5) {
  await setTradingActive(true);
  chrome.alarms.create(ALARM_TRADING, { periodInMinutes: Math.max(1, intervalMin) });

  // 일일 스냅샷 알람 (자정 KST = UTC 15:00)
  const now = new Date();
  const nextMidnight = new Date();
  nextMidnight.setUTCHours(15, 0, 0, 0);
  if (nextMidnight <= now) {
    nextMidnight.setDate(nextMidnight.getDate() + 1);
  }
  chrome.alarms.create(ALARM_DAILY_PNL, {
    when: nextMidnight.getTime(),
    periodInMinutes: 1440,
  });

  updateBadge();
  console.log(`[이와나베리치] 자동매매 시작 (${intervalMin}분 주기)`);
}

// 트레이딩 중지
async function stopTrading() {
  await setTradingActive(false);
  chrome.alarms.clear(ALARM_TRADING);
  chrome.alarms.clear(ALARM_DAILY_PNL);
  chrome.action.setBadgeText({ text: "" });
  console.log("[이와나베리치] 자동매매 중지");
}

// 뱃지 업데이트
async function updateBadge() {
  const active = await isTradingActive();
  if (active) {
    chrome.action.setBadgeText({ text: "ON" });
    chrome.action.setBadgeBackgroundColor({ color: "#22c55e" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

// 메시지 핸들러
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handleMessage = async () => {
    switch (message.type) {
      case "START_TRADING":
        await startTrading(message.intervalMin);
        return { success: true };

      case "STOP_TRADING":
        await stopTrading();
        return { success: true };

      case "GET_STATUS": {
        const active = await isTradingActive();
        const tokens = await getTokens();
        return { active, loggedIn: !!tokens };
      }

      case "TRIGGER_ANALYSIS": {
        await runTradingCycle();
        return { success: true };
      }

      default:
        return { error: "알 수 없는 메시지 타입" };
    }
  };

  handleMessage().then(sendResponse);
  return true; // 비동기 응답
});

// 확장 프로그램 설치/업데이트 시 - 하드코딩된 토큰 자동 설정
chrome.runtime.onInstalled.addListener(async () => {
  console.log("[이와나베리치] 확장 프로그램 설치/업데이트 완료");

  const tokens = await getTokens();
  if (!tokens) {
    // 하드코딩된 토큰 자동 저장 (개발용)
    await chrome.storage.local.set({
      auth_tokens: {
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MDcwZGEwOC1mMjVkLTQxZTAtYTUwOS1iOWMzZTQ1OTJjNGQiLCJlbWFpbCI6ImVyZW5AY3VwaXN0LmNvbSIsImlhdCI6MTc3NDg3OTg1MSwiZXhwIjoxNzc1NDg0NjUxfQ.a0uLDqJcEM13A9AMtkC5fh8AjbjIwytm5Cb6AcA9Xwg",
        refreshToken: "",
        accessTokenExpires: 1775484651000,
      },
    });
    console.log("[이와나베리치] 개발용 토큰 자동 설정 완료");
  }

  updateBadge();
});
