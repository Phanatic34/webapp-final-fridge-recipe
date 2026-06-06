import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL ?? "";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fridge_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: unknown) => {
    if (axios.isAxiosError(err)) {
      const data = err.response?.data as { error?: string } | undefined;
      const msg =
        data?.error ??
        err.message ??
        "請求失敗";
      return Promise.reject(new Error(msg));
    }
    return Promise.reject(err instanceof Error ? err : new Error("發生未知錯誤"));
  }
);
