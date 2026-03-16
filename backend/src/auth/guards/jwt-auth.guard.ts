import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

// JWT 인증 가드 - passport-jwt 전략 사용
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
