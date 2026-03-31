import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateTradingConfigDto } from "./trading-config.dto";
import { RiskLevel } from "@generated/prisma/client";

@Injectable()
export class TradingConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(userId: string) {
    return this.prisma.tradingConfig.findUnique({
      where: { userId },
    });
  }

  async upsertConfig(userId: string, dto: UpdateTradingConfigDto) {
    const data: any = {};
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.targetMarkets !== undefined) data.targetMarkets = dto.targetMarkets;
    if (dto.analysisIntervalMin !== undefined) data.analysisIntervalMin = dto.analysisIntervalMin;
    if (dto.maxInvestmentKrw !== undefined) data.maxInvestmentKrw = dto.maxInvestmentKrw;
    if (dto.maxPositionPercent !== undefined) data.maxPositionPercent = dto.maxPositionPercent;
    if (dto.stopLossPercent !== undefined) data.stopLossPercent = dto.stopLossPercent;
    if (dto.takeProfitPercent !== undefined) data.takeProfitPercent = dto.takeProfitPercent;
    if (dto.riskLevel !== undefined) data.riskLevel = dto.riskLevel as RiskLevel;

    return this.prisma.tradingConfig.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
    });
  }
}
