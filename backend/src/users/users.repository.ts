import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { User, CreateUserDto, UpsertUserData } from "./user.interface";

@Injectable()
export class UsersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * 이메일로 사용자 조회
   * @param email - 사용자 이메일
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.databaseService.queryOne<User>(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
  }

  /**
   * ID로 사용자 조회
   * @param id - 사용자 UUID
   */
  async findById(id: string): Promise<User | null> {
    return this.databaseService.queryOne<User>(
      "SELECT * FROM users WHERE id = $1",
      [id]
    );
  }

  /**
   * 새 사용자 생성
   * @param data - 사용자 생성 데이터
   */
  async create(data: CreateUserDto): Promise<User> {
    const result = await this.databaseService.queryOne<User>(
      `INSERT INTO users (email, name, picture, google_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.email, data.name ?? null, data.picture ?? null, data.google_id ?? null]
    );
    return result!;
  }

  /**
   * 리프레시 토큰 업데이트 (로그아웃 시 null로 설정)
   * @param id - 사용자 UUID
   * @param token - 저장할 리프레시 토큰 (null이면 삭제)
   */
  async updateRefreshToken(id: string, token: string | null): Promise<void> {
    await this.databaseService.queryOne<User>(
      "UPDATE users SET refresh_token = $1, updated_at = NOW() WHERE id = $2",
      [token, id]
    );
  }

  /**
   * 사용자 upsert (이메일 기준 충돌 시 업데이트)
   * @param data - upsert 데이터
   */
  async upsert(data: UpsertUserData): Promise<User> {
    const result = await this.databaseService.queryOne<User>(
      `INSERT INTO users (email, name, picture, google_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email)
       DO UPDATE SET
         name = EXCLUDED.name,
         picture = EXCLUDED.picture,
         google_id = EXCLUDED.google_id,
         updated_at = NOW()
       RETURNING *`,
      [data.email, data.name, data.picture, data.google_id]
    );
    return result!;
  }
}
