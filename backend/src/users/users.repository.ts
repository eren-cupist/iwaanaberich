import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { User } from "@generated/prisma/client";
import { UpsertUserData } from "./user.interface";

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: {
    email: string;
    name?: string | null;
    picture?: string | null;
    googleId?: string | null;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async updateRefreshToken(id: string, token: string | null): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { refreshToken: token },
    });
  }

  async upsert(data: UpsertUserData): Promise<User> {
    return this.prisma.user.upsert({
      where: { email: data.email },
      create: {
        email: data.email,
        name: data.name,
        picture: data.picture,
        googleId: data.google_id,
      },
      update: {
        name: data.name,
        picture: data.picture,
        googleId: data.google_id,
      },
    });
  }

  async updateUpbitKeys(
    id: string,
    accessKey?: string,
    secretKey?: string,
  ): Promise<void> {
    const data: Record<string, string> = {};
    if (accessKey !== undefined) data.upbitAccessKey = accessKey;
    if (secretKey !== undefined) data.upbitSecretKey = secretKey;
    if (Object.keys(data).length === 0) return;

    await this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async getUpbitKeys(
    id: string,
  ): Promise<{ upbitAccessKey: string | null; upbitSecretKey: string | null } | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: { upbitAccessKey: true, upbitSecretKey: true },
    });
  }
}
