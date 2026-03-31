import {
  IsBoolean,
  IsOptional,
  IsArray,
  IsString,
  IsInt,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from "class-validator";

export class UpdateTradingConfigDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetMarkets?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  analysisIntervalMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(5000)
  maxInvestmentKrw?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxPositionPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  stopLossPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  takeProfitPercent?: number;

  @IsOptional()
  @IsEnum(["LOW", "MEDIUM", "HIGH"])
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
}
