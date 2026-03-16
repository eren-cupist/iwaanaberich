import { Global, Module } from "@nestjs/common";
import { Pool } from "pg";
import { DatabaseService } from "./database.service";
import { DATABASE_POOL } from "./database.constants";

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      useFactory: () => {
        // DATABASE_URL 환경변수로 PostgreSQL 커넥션 풀 생성
        return new Pool({
          connectionString: process.env.DATABASE_URL,
        });
      },
    },
    DatabaseService,
  ],
  exports: [DATABASE_POOL, DatabaseService],
})
export class DatabaseModule {}
