import axios from "axios";
import { getTokens, saveTokens, clearTokens } from "./storage";

const API_BASE = "http://localhost:4000";

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터: 토큰 자동 주입 + 만료 시 갱신
axiosInstance.interceptors.request.use(async (config) => {
  const tokens = await getTokens();
  if (!tokens) {
    return Promise.reject(new Error("로그인이 필요합니다."));
  }

  // 토큰 만료 1분 전 자동 갱신
  if (Date.now() >= tokens.accessTokenExpires - 60000) {
    try {
      const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
        refreshToken: tokens.refreshToken,
      });
      await saveTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        accessTokenExpires: data.accessTokenExpires,
      });
      config.headers.Authorization = `Bearer ${data.accessToken}`;
    } catch {
      await clearTokens();
      return Promise.reject(new Error("토큰 갱신 실패. 다시 로그인해주세요."));
    }
  } else {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  return config;
});

// 응답 인터셉터: 401 시 토큰 갱신 후 재시도
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = await getTokens();
        if (!tokens) throw new Error("토큰 없음");

        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken: tokens.refreshToken,
        });
        await saveTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          accessTokenExpires: data.accessTokenExpires,
        });

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return axiosInstance(originalRequest);
      } catch {
        await clearTokens();
        return Promise.reject(new Error("로그인이 만료되었습니다. 다시 로그인해주세요."));
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
