import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { GoogleAuthDto } from "./dto/google-auth.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/google
   * Google ID 토큰으로 로그인 처리
   * @param googleAuthDto - idToken을 포함한 요청 바디
   * @returns accessToken, refreshToken, accessTokenExpires, 사용자 정보
   */
  @Post("google")
  async googleLogin(@Body() googleAuthDto: GoogleAuthDto) {
    return this.authService.googleLogin(googleAuthDto.idToken);
  }

  /**
   * POST /auth/refresh
   * 리프레시 토큰으로 새 accessToken + refreshToken 발급
   * @param refreshTokenDto - refreshToken을 포함한 요청 바디
   * @returns 새 accessToken, refreshToken, accessTokenExpires
   */
  @Post("refresh")
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }
}
