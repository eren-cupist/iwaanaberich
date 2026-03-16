import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { OAuth2Client } from "google-auth-library";
import { UsersService } from "../users/users.service";
import { User } from "../users/user.interface";

// Google 로그인 응답 타입 (컨트롤러에서 반환 타입 추론을 위해 export)
export interface GoogleLoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
  user: User;
}

// 토큰 갱신 응답 타입
export interface RefreshTokensResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
}

@Injectable()
export class AuthService {
  // Google OAuth2 클라이언트 인스턴스
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  /**
   * accessToken 발급 (유효기간 15분)
   * @param userId - 사용자 UUID
   * @param email - 사용자 이메일
   */
  private issueAccessToken(userId: string, email: string): { token: string; expires: number } {
    const expiresIn = 15 * 60; // 15분 (초 단위)
    const token = this.jwtService.sign(
      { sub: userId, email },
      { expiresIn }
    );
    // Unix timestamp (ms)로 만료 시각 계산
    const expires = Date.now() + expiresIn * 1000;
    return { token, expires };
  }

  /**
   * refreshToken 발급 (유효기간 30일)
   * @param userId - 사용자 UUID
   */
  private issueRefreshToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: "30d",
      }
    );
  }

  /**
   * Google ID 토큰 검증 및 로그인 처리
   * @param idToken - Google에서 발급받은 ID 토큰
   * @returns accessToken, refreshToken, accessTokenExpires, 사용자 정보
   */
  async googleLogin(idToken: string): Promise<GoogleLoginResponse> {
    // Google ID 토큰 검증
    let ticket;
    try {
      ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch {
      throw new UnauthorizedException("유효하지 않은 Google ID 토큰입니다.");
    }

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      throw new UnauthorizedException("Google 계정 정보를 가져올 수 없습니다.");
    }

    // Google 프로필 정보 추출
    const { email, name, picture, sub: google_id } = payload;

    // 사용자 upsert (신규 생성 또는 정보 업데이트)
    const user = await this.usersService.upsertGoogleUser({
      email,
      name: name ?? null,
      picture: picture ?? null,
      google_id: google_id ?? null,
    });

    // accessToken 발급 (15분)
    const { token: accessToken, expires: accessTokenExpires } = this.issueAccessToken(user.id, user.email);

    // refreshToken 발급 (30일)
    const refreshToken = this.issueRefreshToken(user.id);

    // DB에 refreshToken 저장
    await this.usersService.updateRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken, accessTokenExpires, user };
  }

  /**
   * 리프레시 토큰으로 새 accessToken + refreshToken 발급
   * @param refreshToken - 클라이언트에서 전달받은 리프레시 토큰
   * @returns 새 accessToken, refreshToken, accessTokenExpires
   */
  async refreshTokens(refreshToken: string): Promise<RefreshTokensResponse> {
    // 리프레시 토큰 검증 및 userId 추출
    let userId: string;
    try {
      const decoded = this.jwtService.verify<{ sub: string }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      userId = decoded.sub;
    } catch {
      throw new UnauthorizedException("유효하지 않은 리프레시 토큰입니다.");
    }

    // DB에서 사용자 조회
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException("사용자를 찾을 수 없습니다.");
    }

    // DB에 저장된 리프레시 토큰과 일치 여부 확인
    if (!user.refresh_token || user.refresh_token !== refreshToken) {
      throw new UnauthorizedException("리프레시 토큰이 일치하지 않습니다.");
    }

    // 새 accessToken 발급 (15분)
    const { token: newAccessToken, expires: accessTokenExpires } = this.issueAccessToken(user.id, user.email);

    // 새 refreshToken 발급 (30일, 토큰 로테이션)
    const newRefreshToken = this.issueRefreshToken(user.id);

    // DB에 새 refreshToken 업데이트
    await this.usersService.updateRefreshToken(user.id, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      accessTokenExpires,
    };
  }
}
