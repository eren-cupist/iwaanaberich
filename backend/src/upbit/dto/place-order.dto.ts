import { IsString, IsEnum, IsOptional, IsNumberString } from "class-validator";

export class PlaceOrderDto {
  @IsString()
  market: string;

  @IsEnum(["bid", "ask"])
  side: "bid" | "ask";

  @IsEnum(["limit", "price", "market"])
  ord_type: "limit" | "price" | "market";

  @IsOptional()
  @IsNumberString()
  volume?: string;

  @IsOptional()
  @IsNumberString()
  price?: string;
}
