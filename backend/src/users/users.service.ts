import { Injectable } from "@nestjs/common";
import { UsersRepository } from "./users.repository";
import { User } from "@generated/prisma/client";
import { UpsertUserData } from "./user.interface";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async upsertGoogleUser(data: UpsertUserData): Promise<User> {
    return this.usersRepository.upsert(data);
  }

  async updateRefreshToken(id: string, token: string | null): Promise<void> {
    return this.usersRepository.updateRefreshToken(id, token);
  }

  async updateUpbitKeys(
    id: string,
    accessKey?: string,
    secretKey?: string,
  ): Promise<void> {
    return this.usersRepository.updateUpbitKeys(id, accessKey, secretKey);
  }

  async getUpbitKeys(
    id: string,
  ): Promise<{ upbitAccessKey: string | null; upbitSecretKey: string | null } | null> {
    return this.usersRepository.getUpbitKeys(id);
  }
}
