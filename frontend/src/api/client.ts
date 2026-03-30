import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL ?? "";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  (err: unknown) => {
    if (axios.isAxiosError(err)) {
      const data = err.response?.data as { error?: string } | undefined;
      const msg =
        data?.error ??
        err.message ??
        "Request failed";
      return Promise.reject(new Error(msg));
    }
    return Promise.reject(err instanceof Error ? err : new Error("Unknown error"));
  }
);
