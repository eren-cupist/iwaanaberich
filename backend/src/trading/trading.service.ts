import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpbitService } from "../upbit/upbit.service";
import { AiAnalysisService } from "../ai-analysis/ai-analysis.service";
import { IndicatorsService } from "../ai-analysis/indicators.service";
import { AnalysisResult, MarketDataForAnalysis } from "../ai-analysis/interfaces/analysis.interface";
import { TradingConfig } from "@generated/prisma/client";

@Injectable()
export class TradingService {
  private readonly logger = new Logger(TradingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly upbitService: UpbitService,
    private readonly aiAnalysisService: AiAnalysisService,
    private readonly indicatorsService: IndicatorsService,
  ) {}

  // 핵심: AI 분석 + 매매 실행 파이프라인
  async analyzeAndTrade(userId: string, market: string) {
    this.logger.log(`========== [${market}] 자동매매 분석 시작 ==========`);

    // 1. 트레이딩 설정 조회
    const config = await this.prisma.tradingConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      this.logger.warn(`[${market}] 트레이딩 설정 없음 - 스킵`);
      return { status: "skip", reason: "트레이딩 설정이 없습니다." };
    }

    // 2. 시장 데이터 수집 (병렬)
    this.logger.log(`[${market}] 시장 데이터 수집 중...`);
    const [minuteCandles, dayCandles, tickerData, accounts] = await Promise.all([
      this.upbitService.getMinuteCandles(1, market, 200),
      this.upbitService.getDayCandles(market, 30),
      this.upbitService.getTicker([market]),
      this.upbitService.getAccounts(userId),
    ]);

    const ticker = tickerData[0];
    if (!ticker) {
      return { status: "error", reason: "현재가를 가져올 수 없습니다." };
    }

    // 3. 잔고 정보 추출
    const krwAccount = accounts.find((a) => a.currency === "KRW");
    const coinCurrency = market.split("-")[1];
    const coinAccount = accounts.find((a) => a.currency === coinCurrency);

    const balance = parseFloat(krwAccount?.balance ?? "0");
    const holdings = parseFloat(coinAccount?.balance ?? "0");

    this.logger.log(`[${market}] 현재가: ${ticker.trade_price.toLocaleString()}원 | 잔고: ${Math.floor(balance).toLocaleString()}원 | 보유: ${holdings} ${coinCurrency}`);

    // 4. 기술적 지표 계산
    const candleData = minuteCandles
      .reverse()
      .map((c) => ({ close: c.trade_price, volume: c.candle_acc_trade_volume }));
    const indicators = this.indicatorsService.calculate(candleData);

    // 5. 일봉 추세 데이터
    const dailyTrend = dayCandles.reverse().map((c, i, arr) => {
      const prevClose = i > 0 ? arr[i - 1].trade_price : c.opening_price;
      return {
        date: c.candle_date_time_kst.split("T")[0],
        close: c.trade_price,
        change: prevClose > 0 ? (c.trade_price - prevClose) / prevClose : 0,
      };
    });

    // 6. 최근 캔들 데이터
    const recentCandles = minuteCandles
      .slice(0, 20)
      .reverse()
      .map((c) => ({
        time: c.candle_date_time_kst,
        open: c.opening_price,
        high: c.high_price,
        low: c.low_price,
        close: c.trade_price,
        volume: c.candle_acc_trade_volume,
      }));

    this.logger.log(`[${market}] 기술 지표 - RSI: ${indicators.rsi.toFixed(1)} | MACD: ${indicators.macd.histogram.toFixed(2)} | 볼린저: ${indicators.bollingerBands.percentB.toFixed(1)}%`);

    // 7. AI 분석 요청
    this.logger.log(`[${market}] GPT-4o 분석 요청 중...`);
    const marketData: MarketDataForAnalysis = {
      market,
      currentPrice: ticker.trade_price,
      balance,
      holdings,
      indicators,
      recentCandles,
      dailyTrend,
      riskLevel: config.riskLevel,
    };

    let analysis: AnalysisResult;
    try {
      analysis = await this.aiAnalysisService.analyze(userId, marketData);
    } catch (error: unknown) {
      const isAiError = error instanceof Error && (error as any).isAiError;
      const aiErrorType = isAiError ? (error as any).aiErrorType : "UNKNOWN";
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(`[${market}] AI 분석 실패 (${aiErrorType}): ${errorMessage}`);
      this.logger.log(`========== [${market}] 자동매매 분석 종료 ==========`);

      return {
        status: "ai_error",
        aiErrorType,
        reason: `AI 분석 실패: ${errorMessage}`,
      };
    }

    this.logger.log(`[${market}] AI 결정: ${analysis.decision} (신뢰도: ${analysis.confidence}%) - ${analysis.reason}`);

    // 8. 매매 실행 결정
    if (analysis.decision === "HOLD" || analysis.confidence < 60) {
      this.logger.log(`[${market}] → HOLD 관망. 매매 없음.`);
      this.logger.log(`========== [${market}] 자동매매 분석 종료 ==========`);
      return {
        status: "hold",
        analysis,
        reason: "AI가 관망을 추천합니다.",
      };
    }

    // 9. 매매 실행
    this.logger.log(`[${market}] → ${analysis.decision} 매매 실행 중...`);
    const tradeResult = await this.executeTrade(
      userId,
      market,
      analysis,
      config,
      balance,
      holdings,
      ticker.trade_price,
    );

    this.logger.log(`[${market}] 매매 결과: ${JSON.stringify(tradeResult)}`);
    this.logger.log(`========== [${market}] 자동매매 분석 종료 ==========`);
    return {
      status: "traded",
      analysis,
      trade: tradeResult,
    };
  }

  // 매매 실행
  private async executeTrade(
    userId: string,
    market: string,
    analysis: AnalysisResult,
    config: TradingConfig,
    balance: number,
    holdings: number,
    currentPrice: number,
  ) {
    const maxInvestment = Number(config.maxInvestmentKrw);
    const maxPositionPercent = config.maxPositionPercent / 100;

    if (analysis.decision === "BUY") {
      // 매수 금액 계산
      const positionPercent = (analysis.suggestedPositionPercent ?? 30) / 100;
      let buyAmount = Math.min(
        balance * positionPercent,
        maxInvestment * maxPositionPercent,
      );

      // 최소 주문 금액 (업비트: 5000원)
      if (buyAmount < 5000) {
        return { status: "skip", reason: "매수 금액이 최소 주문 금액(5000원) 미만입니다." };
      }

      // 소수점 제거
      buyAmount = Math.floor(buyAmount);

      // Trade 레코드 생성
      const trade = await this.prisma.trade.create({
        data: {
          userId,
          market,
          side: "BUY",
          orderType: "MARKET",
          volume: (0),
          price: (buyAmount),
          status: "PENDING",
          reason: analysis.reason,
        },
      });

      try {
        // 시장가 매수 (price = 총 매수 금액)
        const order = await this.upbitService.placeOrder(userId, {
          market,
          side: "bid",
          ord_type: "price",
          price: buyAmount.toString(),
        });

        // Trade 업데이트
        await this.prisma.trade.update({
          where: { id: trade.id },
          data: {
            upbitOrderId: order.uuid,
            status: "SUBMITTED",
          },
        });

        // 체결 확인 (5초 후)
        setTimeout(() => this.checkOrderStatus(userId, trade.id, order.uuid), 5000);

        this.logger.log(`[${market}] 매수 주문 전송: ${buyAmount.toLocaleString()}원`);
        return { tradeId: trade.id, orderId: order.uuid, amount: buyAmount };
      } catch (error) {
        await this.prisma.trade.update({
          where: { id: trade.id },
          data: { status: "FAILED" },
        });
        this.logger.error(`[${market}] 매수 주문 실패:`, error);
        throw error;
      }
    }

    if (analysis.decision === "SELL") {
      if (holdings <= 0) {
        return { status: "skip", reason: "보유 코인이 없어 매도할 수 없습니다." };
      }

      // 매도 수량 계산
      const sellPercent = (analysis.suggestedPositionPercent ?? 100) / 100;
      const sellVolume = holdings * sellPercent;

      // Trade 레코드 생성
      const trade = await this.prisma.trade.create({
        data: {
          userId,
          market,
          side: "SELL",
          orderType: "MARKET",
          volume: (sellVolume),
          status: "PENDING",
          reason: analysis.reason,
        },
      });

      try {
        // 시장가 매도
        const order = await this.upbitService.placeOrder(userId, {
          market,
          side: "ask",
          ord_type: "market",
          volume: sellVolume.toString(),
        });

        await this.prisma.trade.update({
          where: { id: trade.id },
          data: {
            upbitOrderId: order.uuid,
            status: "SUBMITTED",
          },
        });

        setTimeout(() => this.checkOrderStatus(userId, trade.id, order.uuid), 5000);

        this.logger.log(`[${market}] 매도 주문 전송: ${sellVolume} ${market.split("-")[1]}`);
        return { tradeId: trade.id, orderId: order.uuid, volume: sellVolume };
      } catch (error) {
        await this.prisma.trade.update({
          where: { id: trade.id },
          data: { status: "FAILED" },
        });
        this.logger.error(`[${market}] 매도 주문 실패:`, error);
        throw error;
      }
    }

    return { status: "skip", reason: "실행할 매매가 없습니다." };
  }

  // 주문 체결 상태 확인
  private async checkOrderStatus(userId: string, tradeId: string, orderUuid: string) {
    try {
      const order = await this.upbitService.getOrder(userId, orderUuid);

      const statusMap: Record<string, string> = {
        done: "FILLED",
        cancel: "CANCELLED",
        wait: "SUBMITTED",
      };

      const status = statusMap[order.state] ?? "SUBMITTED";

      await this.prisma.trade.update({
        where: { id: tradeId },
        data: {
          status: status as any,
          executedVolume: order.executed_volume ? (order.executed_volume) : null,
          fee: order.paid_fee ? (order.paid_fee) : null,
        },
      });
    } catch (error) {
      this.logger.error(`주문 상태 확인 실패: ${orderUuid}`, error);
    }
  }

  // 거래 이력 조회
  async getTradeHistory(userId: string, limit: number = 50) {
    return this.prisma.trade.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { aiAnalysis: true },
    });
  }

  // 현재 트레이딩 상태 조회
  async getStatus(userId: string) {
    const config = await this.prisma.tradingConfig.findUnique({
      where: { userId },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayTrades = await this.prisma.trade.count({
      where: {
        userId,
        createdAt: { gte: todayStart },
      },
    });

    const recentAnalysis = await this.prisma.aiAnalysis.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return {
      isActive: config?.isActive ?? false,
      targetMarkets: config?.targetMarkets ?? [],
      todayTradeCount: todayTrades,
      lastAnalysis: recentAnalysis,
    };
  }
}
