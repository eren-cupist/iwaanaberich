import { Module } from "@nestjs/common";
import { AiAnalysisService } from "./ai-analysis.service";
import { IndicatorsService } from "./indicators.service";

@Module({
  providers: [AiAnalysisService, IndicatorsService],
  exports: [AiAnalysisService, IndicatorsService],
})
export class AiAnalysisModule {}
