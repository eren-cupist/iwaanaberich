import { Injectable, Logger } from "@nestjs/common";
import OpenAI from "openai";
import { PrismaService } from "../prisma/prisma.service";
import { AnalysisResult, MarketDataForAnalysis } from "./interfaces/analysis.interface";

@Injectable()
export class AiAnalysisService {
  private readonly logger = new Logger(AiAnalysisService.name);
  private readonly openai: OpenAI;
  private readonly model = "gpt-4o";

  constructor(private readonly prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // AI 분석 실행 및 DB 저장
  async analyze(userId: string, data: MarketDataForAnalysis): Promise<AnalysisResult> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(data);

    this.logger.log(`[${data.market}] OpenAI API 요청 시작 (모델: ${this.model})`);
    const startTime = Date.now();

    let response;
    try {
      response = await this.openai.chat.completions.create({
        model: this.model,
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
    } catch (error: unknown) {
      const elapsed = Date.now() - startTime;
      const isAuthError =
        error instanceof Error &&
        "status" in error &&
        ((error as { status: number }).status === 401 || (error as { status: number }).status === 403);
      const isRateLimit =
        error instanceof Error &&
        "status" in error &&
        (error as { status: number }).status === 429;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(`[${data.market}] OpenAI API 호출 실패 (${elapsed}ms): ${errorMessage}`);

      const aiError = new Error(errorMessage);
      (aiError as any).isAiError = true;
      (aiError as any).aiErrorType = isAuthError ? "AUTH_FAILED" : isRateLimit ? "RATE_LIMITED" : "API_ERROR";
      throw aiError;
    }

    const elapsed = Date.now() - startTime;
    this.logger.log(`[${data.market}] OpenAI API 응답 완료 (${elapsed}ms, 토큰: ${response.usage?.prompt_tokens ?? 0}+${response.usage?.completion_tokens ?? 0})`);

    const content = response.choices[0]?.message?.content;
    if (!content) {
      this.logger.error(`[${data.market}] OpenAI 응답이 비어있습니다.`);
      throw new Error("AI 응답이 비어있습니다.");
    }

    this.logger.log(`[${data.market}] OpenAI 응답: ${content}`);

    const result: AnalysisResult = JSON.parse(content);

    // confidence가 60 미만이면 HOLD로 강제
    if (result.confidence < 60) {
      result.decision = "HOLD";
    }

    // DB에 분석 결과 저장
    await this.prisma.aiAnalysis.create({
      data: {
        userId,
        market: data.market,
        decision: result.decision,
        confidence: result.confidence,
        reason: result.reason,
        technicalSummary: data.indicators as any,
        gptModel: this.model,
        promptTokens: response.usage?.prompt_tokens ?? null,
        completionTokens: response.usage?.completion_tokens ?? null,
      },
    });

    this.logger.log(
      `[${data.market}] AI 분석 완료: ${result.decision} (신뢰도: ${result.confidence}%)`,
    );

    return result;
  }

  // AI 일일 요약 생성
  async generateDailySummary(
    trades: { market: string; side: string; executedAmount: number }[],
    totalPnl: number,
  ): Promise<string> {
    const prompt = `오늘의 자동매매 결과를 간단히 요약해주세요 (한국어, 2-3문장):
거래 횟수: ${trades.length}건
거래 내역: ${trades.map((t) => `${t.market} ${t.side} ${t.executedAmount?.toLocaleString()}원`).join(", ")}
총 수익/손실: ${totalPnl?.toLocaleString()}원`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      max_tokens: 200,
      messages: [
        { role: "system", content: "당신은 암호화폐 자동매매 결과를 요약하는 AI입니다. 간결하고 명확하게 한국어로 요약해주세요." },
        { role: "user", content: prompt },
      ],
    });

    return response.choices[0]?.message?.content ?? "일일 요약을 생성할 수 없습니다.";
  }

  private buildSystemPrompt(): string {
    return `당신은 암호화폐 초단타(스캘핑) 전문 AI 트레이더입니다.
반드시 단타 매매 전략으로만 운영하세요.

## 핵심 전략
- 포지션 보유 시간: 5분~1시간 이내. 절대 장기 보유하지 마세요.
- 작은 수익이라도 빠르게 확정하세요. 욕심 부리지 마세요.
- 이미 코인을 보유 중이고 수익 중이면 적극적으로 매도(SELL)하세요.
- 이미 코인을 보유 중이고 손실 중이면 손절 기준에 따라 빠르게 매도하세요.
- 보유 코인이 없을 때만 매수 타이밍을 잡으세요.
- 추세가 불분명하면 무조건 HOLD. 확실한 진입점만 노리세요.

## 단타 매수 시그널 (다음 중 2개 이상 충족 시)
- RSI 30 이하 과매도 후 반등 시작
- MACD 히스토그램이 음에서 양으로 전환
- 볼린저밴드 하단 터치 후 반등
- 5분봉에서 강한 양봉 캔들 출현 + 거래량 급증

## 단타 매도 시그널 (다음 중 1개 이상 충족 시)
- 목표 수익률 1~2% 도달
- RSI 70 이상 과매수
- MACD 히스토그램이 양에서 음으로 전환
- 볼린저밴드 상단 도달

## 응답 형식
응답은 반드시 다음 JSON 형식으로 해주세요:
{
  "decision": "BUY" | "SELL" | "HOLD",
  "confidence": 0-100,
  "reason": "매매 결정 사유 (한국어, 2-3문장)",
  "suggestedPositionPercent": 0-100,
  "stopLossPrice": number | null,
  "takeProfitPrice": number | null
}

## 규칙
1. confidence가 60 미만이면 반드시 HOLD로 결정하세요.
2. 리스크 레벨이 LOW이면 보수적으로, HIGH이면 공격적으로 판단하세요.
3. 현재 보유 포지션과 잔고를 반드시 확인하세요. 이미 보유 중이면 매도 타이밍에 집중하세요.
4. 매수 시 suggestedPositionPercent는 20~50% 범위로 보수적으로 설정하세요. 올인하지 마세요.
5. stopLossPrice는 현재가 대비 -1.5~2% 수준으로 짧게 설정하세요.
6. takeProfitPrice는 현재가 대비 +1~2% 수준으로 짧게 설정하세요.`;
  }

  private buildUserPrompt(data: MarketDataForAnalysis): string {
    const { indicators: ind } = data;

    const recentCandleStr = data.recentCandles
      .slice(-20)
      .map((c) => `${c.time}: O=${c.open} H=${c.high} L=${c.low} C=${c.close} V=${c.volume}`)
      .join("\n");

    const dailyTrendStr = data.dailyTrend
      .slice(-7)
      .map((d) => `${d.date}: ${d.close.toLocaleString()}원 (${d.change >= 0 ? "+" : ""}${(d.change * 100).toFixed(2)}%)`)
      .join("\n");

    return `=== 마켓: ${data.market} ===
=== 현재가: ${data.currentPrice.toLocaleString()} KRW ===
=== 잔고: ${data.balance.toLocaleString()} KRW, 보유 ${data.holdings} ${data.market.split("-")[1] ?? ""} ===
=== 리스크 레벨: ${data.riskLevel} ===

[기술적 지표]
- RSI(14): ${ind.rsi.toFixed(2)}
- MACD: 라인=${ind.macd.macdLine.toFixed(2)}, 시그널=${ind.macd.signalLine.toFixed(2)}, 히스토그램=${ind.macd.histogram.toFixed(2)}
- 이동평균: SMA5=${ind.sma.sma5.toFixed(0)}, SMA20=${ind.sma.sma20.toFixed(0)}, SMA60=${ind.sma.sma60.toFixed(0)}, SMA120=${ind.sma.sma120.toFixed(0)}
- EMA: EMA5=${ind.ema.ema5.toFixed(0)}, EMA20=${ind.ema.ema20.toFixed(0)}
- 볼린저밴드: 상단=${ind.bollingerBands.upper.toFixed(0)}, 중간=${ind.bollingerBands.middle.toFixed(0)}, 하단=${ind.bollingerBands.lower.toFixed(0)}
- 현재가 볼린저 위치: ${ind.bollingerBands.percentB.toFixed(1)}%
- 거래량 비율 (vs 20일 평균): ${ind.volumeRatio}x

[최근 캔들 패턴 (1분봉 최근 20개)]
${recentCandleStr}

[일봉 추세 (최근 7일)]
${dailyTrendStr}`;
  }
}
