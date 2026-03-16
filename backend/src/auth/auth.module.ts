import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    // Passport 모듈 등록 (기본 전략: jwt)
    PassportModule.register({ defaultStrategy: "jwt" }),
    // JWT 모듈 등록 (서명 키 및 만료 기간 설정)
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "fallback-secret",
      signOptions: { expiresIn: "7d" },
    }),
    // UsersService 사용을 위해 UsersModule import
    UsersModule,
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
