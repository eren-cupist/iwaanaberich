import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 설정 (프론트엔드 + 크롬 확장 프로그램)
  app.enableCors({
    origin: [
      "http://localhost:3001",
      /^chrome-extension:\/\//,
    ],
    credentials: true,
  });

  // 전역 유효성 검사 파이프 등록
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.info(`서버가 포트 ${port}에서 실행 중입니다.`);
}

bootstrap();
