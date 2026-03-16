import { Inject, Injectable } from "@nestjs/common";
import { Pool, QueryResult } from "pg";
import { DATABASE_POOL } from "./database.constants";

@Injectable()
export class DatabaseService {
  constructor(
    // DATABASE_POOL 토큰으로 pg Pool 주입
    @Inject(DATABASE_POOL) private readonly pool: Pool
  ) {}

  /**
   * SQL 쿼리 실행 메서드
   * @param text - SQL 쿼리 문자열
   * @param params - 쿼리 파라미터 배열
   */
  async query(text: string, params?: unknown[]): Promise<QueryResult> {
    return this.pool.query(text, params);
  }

  /**
   * 단일 행 조회 메서드
   * @param text - SQL 쿼리 문자열
   * @param params - 쿼리 파라미터 배열
   * @returns 단일 결과 또는 null
   */
  async queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
    const result = await this.pool.query(text, params);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0] as T;
  }
}
