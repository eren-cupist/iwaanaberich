import { IsString, IsNotEmpty } from "class-validator";

export class AnalyzeRequestDto {
  @IsString()
  @IsNotEmpty()
  market: string;
}
