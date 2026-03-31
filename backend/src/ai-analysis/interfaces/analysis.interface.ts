export interface AnalysisResult {
  decision: "BUY" | "SELL" | "HOLD";
  confidence: number;
  reason: string;
  suggestedPositionPercent: number;
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
}

export interface IndicatorData {
  rsi: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
  sma: {
    sma5: number;
    sma20: number;
    sma60: number;
    sma120: number;
  };
  ema: {
    ema5: number;
    ema20: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    percentB: number;
  };
  volumeRatio: number;
}

export interface MarketDataForAnalysis {
  market: string;
  currentPrice: number;
  balance: number;
  holdings: number;
  indicators: IndicatorData;
  recentCandles: { time: string; open: number; high: number; low: number; close: number; volume: number }[];
  dailyTrend: { date: string; close: number; change: number }[];
  riskLevel: string;
}
