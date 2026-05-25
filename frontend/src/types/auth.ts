export type AuthUser = {
  id: number;
  email: string;
  display_name: string;
};

export type AuthState = {
  user: AuthUser | null;
  token: string | null;
};
