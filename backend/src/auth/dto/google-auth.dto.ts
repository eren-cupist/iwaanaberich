import { IsNotEmpty, IsString } from "class-validator";

// Google 로그인 요청 DTO
export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
