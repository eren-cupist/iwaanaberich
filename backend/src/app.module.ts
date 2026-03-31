import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { UpbitModule } from "./upbit/upbit.module";
import { AiAnalysisModule } from "./ai-analysis/ai-analysis.module";
import { TradingModule } from "./trading/trading.module";
import { TradingConfigModule } from "./trading-config/trading-config.module";
import { ProfitLossModule } from "./profit-loss/profit-loss.module";
import { SchedulerModule } from "./scheduler/scheduler.module";

@Module({
  imports: [
    // Prisma ORM 모듈 (전역)
    PrismaModule,
    // 인증 모듈
    AuthModule,
    // 사용자 모듈
    UsersModule,
    // 업비트 API 연동
    UpbitModule,
    // AI 분석
    AiAnalysisModule,
    // 트레이딩 실행
    TradingModule,
    // 트레이딩 설정
    TradingConfigModule,
    // 수익/손실 기록
    ProfitLossModule,
    // 스케줄러 (일일 정산 크론잡)
    SchedulerModule,
  ],
})
export class AppModule {}
