import axios from "axios";
import { getSession } from "next-auth/react";

// 백엔드 API 기본 설정으로 axios 인스턴스 생성
// Next.js rewrites를 통해 /api/backend/* → http://localhost:4000/* 프록시
const instance = axios.create({
  baseURL: "/api/backend",
});

// 요청 인터셉터: 세션에서 backendToken을 가져와 Authorization 헤더에 추가
instance.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.backendToken) {
    config.headers.Authorization = `Bearer ${session.backendToken}`;
  }
  return config;
});

export default instance;
