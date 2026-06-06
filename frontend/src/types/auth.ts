export type AuthUser = {
  id: string;
  email: string;
  display_name: string;
};

export type AuthState = {
  user: AuthUser | null;
  token: string | null;
};
