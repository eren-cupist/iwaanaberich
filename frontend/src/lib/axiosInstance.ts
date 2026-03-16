import axios from "axios";
import { getSession } from "next-auth/react";

// 백엔드 API 기본 설정으로 axios 인스턴스 생성
const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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
