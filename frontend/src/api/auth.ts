import type { AuthUser } from "../types/auth";
import { api } from "./client";

type AuthResponse = { token: string; user: AuthUser };

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/auth/login", { email, password });
  return data;
}

export async function register(
  email: string,
  display_name: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/auth/register", {
    email,
    display_name,
    password,
  });
  return data;
}
