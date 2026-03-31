import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class UpbitKeysDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  accessKey?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  secretKey?: string;
}
