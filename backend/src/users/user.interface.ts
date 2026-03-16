// 사용자 엔티티 인터페이스
export interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  google_id: string | null;
  refresh_token: string | null;
  created_at: Date;
  updated_at: Date;
}

// 사용자 생성 DTO
export interface CreateUserDto {
  email: string;
  name?: string | null;
  picture?: string | null;
  google_id?: string | null;
}

// Google 로그인 upsert 데이터 타입
export interface UpsertUserData {
  email: string;
  name: string | null;
  picture: string | null;
  google_id: string | null;
}
