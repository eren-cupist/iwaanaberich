import axios from "axios";

const instance = axios.create({
  baseURL: "/api/backend",
});

// 토큰을 외부에서 세팅 (getSession 호출 없음)
let token: string | null = null;

export function setAxiosToken(t: string | null) {
  token = t;
}

instance.interceptors.request.use((config) => {
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
