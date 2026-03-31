import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { UsersService } from "../users/users.service";
import { encrypt, decrypt } from "./upbit-crypto.util";
import {
  UpbitAccount,
  UpbitTicker,
  UpbitCandle,
  UpbitOrderbook,
  UpbitOrder,
  UpbitMarket,
} from "./interfaces/upbit.interface";

const UPBIT_API_URL = "https://api.upbit.com/v1";

// 간단한 레이트 리미터
class RateLimiter {
  private lastCall = 0;

  constructor(private readonly minIntervalMs: number) {}

  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastCall;
    if (elapsed < this.minIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minIntervalMs - elapsed));
    }
    this.lastCall = Date.now();
  }
}

@Injectable()
export class UpbitService {
  // exchange API: 10 req/s → 100ms 간격
  private exchangeLimiter = new RateLimiter(100);
  // quotation API: 30 req/s → 34ms 간격
  private quotationLimiter = new RateLimiter(34);

  constructor(private readonly usersService: UsersService) {}

  // Upbit API 키 저장 (암호화, 보낸 값만 업데이트)
  async saveKeys(userId: string, accessKey?: string, secretKey?: string): Promise<void> {
    const encryptedAccess = accessKey ? encrypt(accessKey) : undefined;
    const encryptedSecret = secretKey ? encrypt(secretKey) : undefined;
    await this.usersService.updateUpbitKeys(userId, encryptedAccess, encryptedSecret);
  }

  // Upbit API 키 복호화하여 가져오기
  private async getDecryptedKeys(userId: string): Promise<{ accessKey: string; secretKey: string }> {
    const keys = await this.usersService.getUpbitKeys(userId);
    if (!keys || !keys.upbitAccessKey || !keys.upbitSecretKey) {
      throw new UnauthorizedException("Upbit API 키가 등록되지 않았습니다.");
    }
    return {
      accessKey: decrypt(keys.upbitAccessKey),
      secretKey: decrypt(keys.upbitSecretKey),
    };
  }

  // Upbit JWT 토큰 생성 (쿼리 파라미터 없는 경우)
  private generateToken(accessKey: string, secretKey: string): string {
    const payload = {
      access_key: accessKey,
      nonce: uuidv4(),
    };
    return jwt.sign(payload, secretKey);
  }

  // Upbit JWT 토큰 생성 (쿼리 파라미터 있는 경우)
  private generateTokenWithQuery(accessKey: string, secretKey: string, query: string): string {
    const queryHash = crypto.createHash("sha512").update(query, "utf-8").digest("hex");
    const payload = {
      access_key: accessKey,
      nonce: uuidv4(),
      query_hash: queryHash,
      query_hash_alg: "SHA512",
    };
    return jwt.sign(payload, secretKey);
  }

  // 인증 필요 없는 API 호출 (시세 조회)
  private async fetchPublic<T>(path: string, params?: Record<string, string>): Promise<T> {
    await this.quotationLimiter.wait();

    const url = new URL(`${UPBIT_API_URL}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Upbit API 오류: ${error}`);
    }

    return response.json() as Promise<T>;
  }

  // 인증 필요한 API 호출 (GET)
  private async fetchPrivate<T>(userId: string, path: string, params?: Record<string, string>): Promise<T> {
    await this.exchangeLimiter.wait();

    const { accessKey, secretKey } = await this.getDecryptedKeys(userId);

    const url = new URL(`${UPBIT_API_URL}${path}`);
    let token: string;

    if (params && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
      token = this.generateTokenWithQuery(accessKey, secretKey, queryString);
    } else {
      token = this.generateToken(accessKey, secretKey);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Upbit API 오류: ${error}`);
    }

    return response.json() as Promise<T>;
  }

  // 인증 필요한 API 호출 (POST)
  private async postPrivate<T>(userId: string, path: string, body: Record<string, string>): Promise<T> {
    await this.exchangeLimiter.wait();

    const { accessKey, secretKey } = await this.getDecryptedKeys(userId);
    const queryString = new URLSearchParams(body).toString();
    const token = this.generateTokenWithQuery(accessKey, secretKey, queryString);

    const response = await fetch(`${UPBIT_API_URL}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Upbit API 오류: ${error}`);
    }

    return response.json() as Promise<T>;
  }

  // === 공개 API (시세) ===

  // 마켓 목록 조회
  async getMarkets(): Promise<UpbitMarket[]> {
    return this.fetchPublic<UpbitMarket[]>("/market/all", { isDetails: "false" });
  }

  // 현재가 조회
  async getTicker(markets: string[]): Promise<UpbitTicker[]> {
    return this.fetchPublic<UpbitTicker[]>("/ticker", {
      markets: markets.join(","),
    });
  }

  // 분봉 캔들 조회
  async getMinuteCandles(unit: number, market: string, count: number = 200): Promise<UpbitCandle[]> {
    return this.fetchPublic<UpbitCandle[]>(`/candles/minutes/${unit}`, {
      market,
      count: count.toString(),
    });
  }

  // 일봉 캔들 조회
  async getDayCandles(market: string, count: number = 30): Promise<UpbitCandle[]> {
    return this.fetchPublic<UpbitCandle[]>("/candles/days", {
      market,
      count: count.toString(),
    });
  }

  // 호가 조회
  async getOrderbook(markets: string[]): Promise<UpbitOrderbook[]> {
    return this.fetchPublic<UpbitOrderbook[]>("/orderbook", {
      markets: markets.join(","),
    });
  }

  // === 인증 API ===

  // 잔고 조회
  async getAccounts(userId: string): Promise<UpbitAccount[]> {
    return this.fetchPrivate<UpbitAccount[]>(userId, "/accounts");
  }

  // 주문하기
  async placeOrder(
    userId: string,
    params: {
      market: string;
      side: "bid" | "ask";
      ord_type: "limit" | "price" | "market";
      volume?: string;
      price?: string;
    },
  ): Promise<UpbitOrder> {
    const body: Record<string, string> = {
      market: params.market,
      side: params.side,
      ord_type: params.ord_type,
    };
    if (params.volume) body.volume = params.volume;
    if (params.price) body.price = params.price;

    return this.postPrivate<UpbitOrder>(userId, "/orders", body);
  }

  // 주문 조회
  async getOrder(userId: string, uuid: string): Promise<UpbitOrder> {
    return this.fetchPrivate<UpbitOrder>(userId, "/order", { uuid });
  }

  // 주문 목록 조회
  async getOrders(userId: string, market?: string, state?: string): Promise<UpbitOrder[]> {
    const params: Record<string, string> = {};
    if (market) params.market = market;
    if (state) params.state = state;
    return this.fetchPrivate<UpbitOrder[]>(userId, "/orders", params);
  }

  // Upbit API 키 개별 등록 여부 확인
  async getKeysStatus(userId: string): Promise<{ accessKey: boolean; secretKey: boolean }> {
    const keys = await this.usersService.getUpbitKeys(userId);
    return {
      accessKey: !!keys?.upbitAccessKey,
      secretKey: !!keys?.upbitSecretKey,
    };
  }
}
