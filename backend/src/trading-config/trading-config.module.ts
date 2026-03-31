import { Module } from "@nestjs/common";
import { TradingConfigService } from "./trading-config.service";
import { TradingConfigController } from "./trading-config.controller";

@Module({
  providers: [TradingConfigService],
  controllers: [TradingConfigController],
  exports: [TradingConfigService],
})
export class TradingConfigModule {}
