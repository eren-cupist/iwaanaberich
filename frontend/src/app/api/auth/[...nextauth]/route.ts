// next-auth v5 핸들러 - auth.ts는 frontend/ 루트에 위치 (src 밖 5단계 상위)
import { handlers } from "../../../../../auth";

export const { GET, POST } = handlers;
