import { Controller, Get, Post, Query, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ProfitLossService } from "./profit-loss.service";

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

@Controller("profit-loss")
@UseGuards(JwtAuthGuard)
export class ProfitLossController {
  constructor(private readonly profitLossService: ProfitLossService) {}

  // 일별 수익/손실 조회
  @Get("daily")
  async getDailyPnl(
    @Request() req: RequestWithUser,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.profitLossService.getDailyPnl(req.user.userId, startDate, endDate);
  }

  // 기간별 요약
  @Get("summary")
  async getSummary(
    @Request() req: RequestWithUser,
    @Query("days") days?: string,
  ) {
    return this.profitLossService.getSummary(
      req.user.userId,
      days ? parseInt(days, 10) : 30,
    );
  }

  // 수동 스냅샷 생성
  @Post("snapshot")
  async createSnapshot(@Request() req: RequestWithUser) {
    return this.profitLossService.createDailySnapshot(req.user.userId);
  }
}
