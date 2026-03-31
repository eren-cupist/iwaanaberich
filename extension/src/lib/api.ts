import axiosInstance from "./axiosInstance";

// === 타입 ===

export interface UserMe {
  data: { name: string; email: string; picture: string | null };
}

export interface TradingStatusData {
  isActive: boolean;
  targetMarkets: string[];
  todayTradeCount: number;
  lastAnalysis: {
    market: string;
    decision: string;
    confidence: number;
    reason: string;
    createdAt: string;
  } | null;
}

export interface UpbitKeysStatus {
  accessKey: boolean;
  secretKey: boolean;
}

export interface UpbitAccount {
  currency: string;
  balance: string;
  locked: string;
  avg_buy_price: string;
}

export interface ProfitLossSummary {
  totalRealizedPnl: number;
  totalFees: number;
  netPnl: number;
  totalTrades: number;
  winDays: number;
  lossDays: number;
  winRate: number;
}

export interface TradingConfig {
  isActive: boolean;
  targetMarkets: string[];
  analysisIntervalMin: number;
  maxInvestmentKrw: number;
  maxPositionPercent: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  riskLevel: string;
}

// === API 함수 ===

export async function getMe() {
  const { data } = await axiosInstance.get<UserMe>("/users/me");
  return data;
}

export async function getTradingStatus() {
  const { data } = await axiosInstance.get<TradingStatusData>("/trading/status");
  return data;
}

export async function triggerAnalysis(market: string) {
  const { data } = await axiosInstance.post("/trading/analyze", { market });
  return data;
}

export async function getTradingConfig() {
  const { data } = await axiosInstance.get<TradingConfig>("/trading-config");
  return data;
}

export async function updateTradingConfig(config: Partial<TradingConfig>) {
  const { data } = await axiosInstance.put("/trading-config", config);
  return data;
}

export async function saveUpbitKeys(params: { accessKey?: string; secretKey?: string }) {
  const { data } = await axiosInstance.put("/upbit/keys", params);
  return data;
}

export async function getUpbitAccounts() {
  const { data } = await axiosInstance.get<UpbitAccount[]>("/upbit/accounts");
  return data;
}

export async function getUpbitKeysStatus() {
  const { data } = await axiosInstance.get<UpbitKeysStatus>("/upbit/keys/status");
  return data;
}

export async function getProfitLossSummary(days: number = 7) {
  const { data } = await axiosInstance.get<ProfitLossSummary>(`/profit-loss/summary?days=${days}`);
  return data;
}

export async function getTradeHistory(limit: number = 10) {
  const { data } = await axiosInstance.get(`/trading/history?limit=${limit}`);
  return data;
}
