import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { ProfitLossService } from "../profit-loss/profit-loss.service";

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly profitLossService: ProfitLossService,
  ) {}

  // 매일 자정(KST) 일일 수익/손실 스냅샷 생성
  // UTC 기준 15:00 = KST 00:00
  @Cron("0 15 * * *")
  async handleDailySnapshot() {
    this.logger.log("일일 수익/손실 스냅샷 크론잡 시작");

    // 자동매매가 활성화된 모든 사용자 조회
    const activeConfigs = await this.prisma.tradingConfig.findMany({
      where: { isActive: true },
      select: { userId: true },
    });

    for (const config of activeConfigs) {
      try {
        await this.profitLossService.createDailySnapshot(config.userId);
      } catch (error) {
        this.logger.error(`[${config.userId}] 일일 스냅샷 생성 실패:`, error);
      }
    }

    this.logger.log(`일일 스냅샷 완료: ${activeConfigs.length}명 처리`);
  }
}
