import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    // 데이터베이스 연결 모듈 (전역)
    DatabaseModule,
    // 인증 모듈
    AuthModule,
    // 사용자 모듈
    UsersModule,
  ],
})
export class AppModule {}
