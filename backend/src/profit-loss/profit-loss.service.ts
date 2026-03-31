import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpbitService } from "../upbit/upbit.service";
import { AiAnalysisService } from "../ai-analysis/ai-analysis.service";

@Injectable()
export class ProfitLossService {
  private readonly logger = new Logger(ProfitLossService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly upbitService: UpbitService,
    private readonly aiAnalysisService: AiAnalysisService,
  ) {}

  // 일별 수익/손실 조회
  async getDailyPnl(userId: string, startDate?: string, endDate?: string) {
    const where: any = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    return this.prisma.dailyProfitLoss.findMany({
      where,
      orderBy: { date: "desc" },
    });
  }

  // 기간별 수익 요약
  async getSummary(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await this.prisma.dailyProfitLoss.findMany({
      where: {
        userId,
        date: { gte: startDate },
      },
      orderBy: { date: "asc" },
    });

    const totalRealizedPnl = records.reduce(
      (sum, r) => sum + Number(r.realizedPnl),
      0,
    );
    const totalFees = records.reduce(
      (sum, r) => sum + Number(r.totalFees),
      0,
    );
    const totalTrades = records.reduce(
      (sum, r) => sum + r.tradeCount,
      0,
    );

    const winDays = records.filter((r) => Number(r.realizedPnl) > 0).length;
    const lossDays = records.filter((r) => Number(r.realizedPnl) < 0).length;

    return {
      period: `${days}일`,
      totalRealizedPnl,
      totalFees,
      netPnl: totalRealizedPnl - totalFees,
      totalTrades,
      winDays,
      lossDays,
      winRate: records.length > 0 ? (winDays / records.length) * 100 : 0,
      records,
    };
  }

  // 일일 스냅샷 생성 (크론잡에서 호출)
  async createDailySnapshot(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 오늘의 거래 데이터 집계
    const todayTrades = await this.prisma.trade.findMany({
      where: {
        userId,
        createdAt: { gte: today },
        status: "FILLED",
      },
    });

    const totalBuyAmount = todayTrades
      .filter((t) => t.side === "BUY")
      .reduce((sum, t) => sum + Number(t.executedAmount ?? 0), 0);

    const totalSellAmount = todayTrades
      .filter((t) => t.side === "SELL")
      .reduce((sum, t) => sum + Number(t.executedAmount ?? 0), 0);

    const totalFees = todayTrades.reduce(
      (sum, t) => sum + Number(t.fee ?? 0),
      0,
    );

    const realizedPnl = totalSellAmount - totalBuyAmount;

    // 포트폴리오 평가액 계산
    let portfolioValue = 0;
    try {
      const accounts = await this.upbitService.getAccounts(userId);
      for (const account of accounts) {
        if (account.currency === "KRW") {
          portfolioValue += parseFloat(account.balance);
        } else {
          // 현재가 조회하여 평가액 계산
          try {
            const tickers = await this.upbitService.getTicker([`KRW-${account.currency}`]);
            if (tickers[0]) {
              portfolioValue += parseFloat(account.balance) * tickers[0].trade_price;
            }
          } catch {
            // KRW 마켓이 없는 코인은 건너뜀
          }
        }
      }
    } catch {
      this.logger.warn(`[${userId}] 포트폴리오 평가액 계산 실패`);
    }

    // AI 일일 요약 생성
    let aiSummary: string | null = null;
    if (todayTrades.length > 0) {
      try {
        aiSummary = await this.aiAnalysisService.generateDailySummary(
          todayTrades.map((t) => ({
            market: t.market,
            side: t.side,
            executedAmount: Number(t.executedAmount ?? 0),
          })),
          realizedPnl,
        );
      } catch {
        this.logger.warn("AI 일일 요약 생성 실패");
      }
    }

    // upsert (같은 날짜에 이미 있으면 업데이트)
    const result = await this.prisma.dailyProfitLoss.upsert({
      where: {
        userId_date: { userId, date: today },
      },
      create: {
        userId,
        date: today,
        totalBuyAmount: (totalBuyAmount),
        totalSellAmount: (totalSellAmount),
        realizedPnl: (realizedPnl),
        totalFees: (totalFees),
        tradeCount: todayTrades.length,
        portfolioValue: (portfolioValue),
        aiSummary,
      },
      update: {
        totalBuyAmount: (totalBuyAmount),
        totalSellAmount: (totalSellAmount),
        realizedPnl: (realizedPnl),
        totalFees: (totalFees),
        tradeCount: todayTrades.length,
        portfolioValue: (portfolioValue),
        aiSummary,
      },
    });

    this.logger.log(
      `[${userId}] 일일 스냅샷 생성 완료: PnL=${realizedPnl.toLocaleString()}원, 거래=${todayTrades.length}건`,
    );

    return result;
  }
}
