import { AuthTokens } from "../types";

const STORAGE_KEYS = {
  AUTH_TOKENS: "auth_tokens",
  TRADING_ACTIVE: "trading_active",
  LAST_ANALYSIS: "last_analysis",
};

// 인증 토큰 저장
export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.AUTH_TOKENS]: tokens });
}

// 인증 토큰 조회
export async function getTokens(): Promise<AuthTokens | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.AUTH_TOKENS);
  return result[STORAGE_KEYS.AUTH_TOKENS] ?? null;
}

// 인증 토큰 삭제
export async function clearTokens(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.AUTH_TOKENS);
}

// 트레이딩 상태 저장
export async function setTradingActive(active: boolean): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.TRADING_ACTIVE]: active });
}

// 트레이딩 상태 조회
export async function isTradingActive(): Promise<boolean> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.TRADING_ACTIVE);
  return result[STORAGE_KEYS.TRADING_ACTIVE] ?? false;
}
