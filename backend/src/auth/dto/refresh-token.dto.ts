import { IsString } from "class-validator";

// 리프레시 토큰 요청 DTO
export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
