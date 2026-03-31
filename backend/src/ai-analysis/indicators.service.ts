import { Injectable } from "@nestjs/common";
import { RSI, MACD, SMA, EMA, BollingerBands } from "technicalindicators";
import { IndicatorData } from "./interfaces/analysis.interface";

@Injectable()
export class IndicatorsService {
  // 캔들 데이터로부터 기술적 지표 계산
  calculate(candles: { close: number; volume: number }[]): IndicatorData {
    const closes = candles.map((c) => c.close);
    const volumes = candles.map((c) => c.volume);

    // RSI (14)
    const rsiValues = RSI.calculate({ values: closes, period: 14 });
    const rsi = rsiValues[rsiValues.length - 1] ?? 50;

    // MACD (12, 26, 9)
    const macdValues = MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });
    const latestMacd = macdValues[macdValues.length - 1];
    const macd = {
      macdLine: latestMacd?.MACD ?? 0,
      signalLine: latestMacd?.signal ?? 0,
      histogram: latestMacd?.histogram ?? 0,
    };

    // SMA (5, 20, 60, 120)
    const sma5 = this.getLatestSMA(closes, 5);
    const sma20 = this.getLatestSMA(closes, 20);
    const sma60 = this.getLatestSMA(closes, 60);
    const sma120 = this.getLatestSMA(closes, 120);

    // EMA (5, 20)
    const ema5 = this.getLatestEMA(closes, 5);
    const ema20 = this.getLatestEMA(closes, 20);

    // 볼린저 밴드 (20, 2)
    const bbValues = BollingerBands.calculate({
      values: closes,
      period: 20,
      stdDev: 2,
    });
    const latestBB = bbValues[bbValues.length - 1];
    const currentPrice = closes[closes.length - 1];
    const bbRange = (latestBB?.upper ?? 0) - (latestBB?.lower ?? 0);
    const percentB = bbRange > 0
      ? ((currentPrice - (latestBB?.lower ?? 0)) / bbRange) * 100
      : 50;

    const bollingerBands = {
      upper: latestBB?.upper ?? 0,
      middle: latestBB?.middle ?? 0,
      lower: latestBB?.lower ?? 0,
      percentB,
    };

    // 거래량 비율 (현재 vs 20일 평균)
    const recentVolumes = volumes.slice(-20);
    const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
    const currentVolume = volumes[volumes.length - 1] ?? 0;
    const volumeRatio = avgVolume > 0 ? currentVolume / avgVolume : 1;

    return {
      rsi,
      macd,
      sma: { sma5, sma20, sma60, sma120 },
      ema: { ema5, ema20 },
      bollingerBands,
      volumeRatio: Math.round(volumeRatio * 100) / 100,
    };
  }

  private getLatestSMA(values: number[], period: number): number {
    const result = SMA.calculate({ values, period });
    return result[result.length - 1] ?? 0;
  }

  private getLatestEMA(values: number[], period: number): number {
    const result = EMA.calculate({ values, period });
    return result[result.length - 1] ?? 0;
  }
}
