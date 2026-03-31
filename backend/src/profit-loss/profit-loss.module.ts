import { Module } from "@nestjs/common";
import { UpbitModule } from "../upbit/upbit.module";
import { AiAnalysisModule } from "../ai-analysis/ai-analysis.module";
import { ProfitLossService } from "./profit-loss.service";
import { ProfitLossController } from "./profit-loss.controller";

@Module({
  imports: [UpbitModule, AiAnalysisModule],
  providers: [ProfitLossService],
  controllers: [ProfitLossController],
  exports: [ProfitLossService],
})
export class ProfitLossModule {}
