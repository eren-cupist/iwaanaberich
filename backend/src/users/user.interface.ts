// Google 로그인 upsert 데이터 타입
export interface UpsertUserData {
  email: string;
  name: string | null;
  picture: string | null;
  google_id: string | null;
}
