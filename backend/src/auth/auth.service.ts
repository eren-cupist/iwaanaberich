import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { OAuth2Client } from "google-auth-library";
import { UsersService } from "../users/users.service";
import { User } from "@generated/prisma/client";

export interface GoogleLoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
  user: User;
}

export interface RefreshTokensResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
}

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  private issueAccessToken(userId: string, email: string): { token: string; expires: number } {
    const expiresIn = 15 * 60;
    const token = this.jwtService.sign(
      { sub: userId, email },
      { expiresIn }
    );
    const expires = Date.now() + expiresIn * 1000;
    return { token, expires };
  }

  private issueRefreshToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: "30d",
      }
    );
  }

  async googleLogin(idToken: string): Promise<GoogleLoginResponse> {
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

    const { email, name, picture, sub: google_id } = payload;

    const user = await this.usersService.upsertGoogleUser({
      email,
      name: name ?? null,
      picture: picture ?? null,
      google_id: google_id ?? null,
    });

    const { token: accessToken, expires: accessTokenExpires } = this.issueAccessToken(user.id, user.email);
    const refreshToken = this.issueRefreshToken(user.id);

    await this.usersService.updateRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken, accessTokenExpires, user };
  }

  async refreshTokens(refreshToken: string): Promise<RefreshTokensResponse> {
    let userId: string;
    try {
      const decoded = this.jwtService.verify<{ sub: string }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      userId = decoded.sub;
    } catch {
      throw new UnauthorizedException("유효하지 않은 리프레시 토큰입니다.");
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException("사용자를 찾을 수 없습니다.");
    }

    // Prisma에서는 camelCase: user.refreshToken
    if (!user.refreshToken || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException("리프레시 토큰이 일치하지 않습니다.");
    }

    const { token: newAccessToken, expires: accessTokenExpires } = this.issueAccessToken(user.id, user.email);
    const newRefreshToken = this.issueRefreshToken(user.id);

    await this.usersService.updateRefreshToken(user.id, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      accessTokenExpires,
    };
  }
}
