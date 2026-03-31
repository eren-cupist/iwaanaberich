import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  Param,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UpbitService } from "./upbit.service";
import { UpbitKeysDto } from "./dto/upbit-keys.dto";
import { PlaceOrderDto } from "./dto/place-order.dto";

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

@Controller("upbit")
@UseGuards(JwtAuthGuard)
export class UpbitController {
  constructor(private readonly upbitService: UpbitService) {}

  // Upbit API 키 저장
  @Put("keys")
  async saveKeys(@Request() req: RequestWithUser, @Body() dto: UpbitKeysDto) {
    await this.upbitService.saveKeys(req.user.userId, dto.accessKey, dto.secretKey);
    return { message: "Upbit API 키가 등록되었습니다." };
  }

  // Upbit API 키 개별 등록 여부 확인
  @Get("keys/status")
  async keysStatus(@Request() req: RequestWithUser) {
    return this.upbitService.getKeysStatus(req.user.userId);
  }

  // 잔고 조회
  @Get("accounts")
  async getAccounts(@Request() req: RequestWithUser) {
    return this.upbitService.getAccounts(req.user.userId);
  }

  // 마켓 목록
  @Get("markets")
  async getMarkets() {
    return this.upbitService.getMarkets();
  }

  // 현재가
  @Get("ticker")
  async getTicker(@Query("markets") markets: string) {
    return this.upbitService.getTicker(markets.split(","));
  }

  // 분봉 캔들
  @Get("candles/minutes/:unit")
  async getMinuteCandles(
    @Param("unit") unit: string,
    @Query("market") market: string,
    @Query("count") count?: string,
  ) {
    return this.upbitService.getMinuteCandles(
      parseInt(unit, 10),
      market,
      count ? parseInt(count, 10) : 200,
    );
  }

  // 일봉 캔들
  @Get("candles/days")
  async getDayCandles(
    @Query("market") market: string,
    @Query("count") count?: string,
  ) {
    return this.upbitService.getDayCandles(market, count ? parseInt(count, 10) : 30);
  }

  // 호가
  @Get("orderbook")
  async getOrderbook(@Query("markets") markets: string) {
    return this.upbitService.getOrderbook(markets.split(","));
  }

  // 주문하기
  @Post("orders")
  async placeOrder(@Request() req: RequestWithUser, @Body() dto: PlaceOrderDto) {
    return this.upbitService.placeOrder(req.user.userId, dto);
  }

  // 주문 조회
  @Get("order")
  async getOrder(@Request() req: RequestWithUser, @Query("uuid") uuid: string) {
    return this.upbitService.getOrder(req.user.userId, uuid);
  }
}
