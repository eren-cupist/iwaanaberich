import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { TradingService } from "./trading.service";
import { AnalyzeRequestDto } from "./dto/analyze-request.dto";

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

@Controller("trading")
@UseGuards(JwtAuthGuard)
export class TradingController {
  constructor(private readonly tradingService: TradingService) {}

  // AI 분석 + 매매 실행
  @Post("analyze")
  async analyze(@Request() req: RequestWithUser, @Body() dto: AnalyzeRequestDto) {
    return this.tradingService.analyzeAndTrade(req.user.userId, dto.market);
  }

  // 거래 이력 조회
  @Get("history")
  async getHistory(
    @Request() req: RequestWithUser,
    @Query("limit") limit?: string,
  ) {
    return this.tradingService.getTradeHistory(
      req.user.userId,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  // 현재 트레이딩 상태
  @Get("status")
  async getStatus(@Request() req: RequestWithUser) {
    return this.tradingService.getStatus(req.user.userId);
  }
}
