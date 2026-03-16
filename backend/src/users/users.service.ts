import { Injectable } from "@nestjs/common";
import { UsersRepository } from "./users.repository";
import { User, UpsertUserData } from "./user.interface";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  /**
   * 이메일로 사용자 조회
   * @param email - 사용자 이메일
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  /**
   * ID로 사용자 조회
   * @param id - 사용자 UUID
   */
  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  /**
   * Google 로그인 사용자 upsert
   * - 이미 가입된 이메일이면 정보 업데이트
   * - 신규 이메일이면 새 사용자 생성
   * @param data - Google 프로필 데이터
   */
  async upsertGoogleUser(data: UpsertUserData): Promise<User> {
    return this.usersRepository.upsert(data);
  }

  /**
   * 리프레시 토큰 업데이트
   * @param id - 사용자 UUID
   * @param token - 저장할 리프레시 토큰 (null이면 삭제)
   */
  async updateRefreshToken(id: string, token: string | null): Promise<void> {
    return this.usersRepository.updateRefreshToken(id, token);
  }
}
