export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
}

export interface TradingStatus {
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

export interface DailyPnlSummary {
  totalRealizedPnl: number;
  totalFees: number;
  netPnl: number;
  totalTrades: number;
  winDays: number;
  lossDays: number;
  winRate: number;
}

export type MessageType =
  | "START_TRADING"
  | "STOP_TRADING"
  | "GET_STATUS"
  | "TRIGGER_ANALYSIS"
  | "LOGIN_SUCCESS";
