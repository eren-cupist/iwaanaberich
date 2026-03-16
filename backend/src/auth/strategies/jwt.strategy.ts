import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

// JWT 페이로드 타입
interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Authorization 헤더에서 Bearer 토큰 추출
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // JWT_SECRET 환경변수로 서명 검증
      secretOrKey: process.env.JWT_SECRET ?? "fallback-secret",
    });
  }

  /**
   * JWT 검증 후 req.user에 저장될 객체 반환
   * @param payload - 디코딩된 JWT 페이로드
   */
  async validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
}
