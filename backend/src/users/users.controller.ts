import {
  Controller,
  Get,
  NotFoundException,
  Request,
  UseGuards,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

// JWT 페이로드에서 추출되는 요청 유저 타입
interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users/me
   * 현재 로그인된 사용자 정보 반환
   * JWT 인증 필요
   */
  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getMe(@Request() req: RequestWithUser) {
    const user = await this.usersService.findById(req.user.userId);

    if (!user) {
      throw new NotFoundException("사용자를 찾을 수 없습니다.");
    }

    return { data: user };
  }
}
