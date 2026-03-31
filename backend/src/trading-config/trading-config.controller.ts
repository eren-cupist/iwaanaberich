import { Controller, Get, Put, Body, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { TradingConfigService } from "./trading-config.service";
import { UpdateTradingConfigDto } from "./trading-config.dto";

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

@Controller("trading-config")
@UseGuards(JwtAuthGuard)
export class TradingConfigController {
  constructor(private readonly tradingConfigService: TradingConfigService) {}

  @Get()
  async getConfig(@Request() req: RequestWithUser) {
    return this.tradingConfigService.getConfig(req.user.userId);
  }

  @Put()
  async updateConfig(
    @Request() req: RequestWithUser,
    @Body() dto: UpdateTradingConfigDto,
  ) {
    return this.tradingConfigService.upsertConfig(req.user.userId, dto);
  }
}
