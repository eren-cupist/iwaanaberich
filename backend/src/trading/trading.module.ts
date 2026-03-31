import { Module } from "@nestjs/common";
import { UpbitModule } from "../upbit/upbit.module";
import { AiAnalysisModule } from "../ai-analysis/ai-analysis.module";
import { TradingService } from "./trading.service";
import { TradingController } from "./trading.controller";

@Module({
  imports: [UpbitModule, AiAnalysisModule],
  providers: [TradingService],
  controllers: [TradingController],
  exports: [TradingService],
})
export class TradingModule {}
