// 백엔드 사용자 모델 타입 정의
export interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  google_id: string | null;
  created_at: string;
  updated_at: string;
}
