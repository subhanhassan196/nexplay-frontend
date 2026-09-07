import { api } from "@/lib/api/axios";
import type { RegisterFormValues, LoginFormValues, ResetPasswordFormValues } from "@/lib/validators/auth";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: "PLAYER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";
  isEmailVerified: boolean;
  createdAt: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const authApi = {
  register: (payload: RegisterFormValues) =>
    api.post<ApiEnvelope<{ user: AuthUser }>>("/auth/register", payload),

  login: (payload: LoginFormValues) =>
    api.post<ApiEnvelope<{ user: AuthUser }>>("/auth/login", payload),

  logout: () => api.post<ApiEnvelope<null>>("/auth/logout"),

  me: () => api.get<ApiEnvelope<{ user: AuthUser }>>("/auth/me"),

  verifyEmail: (token: string) => api.post<ApiEnvelope<null>>("/auth/verify-email", { token }),

  resendVerification: (email: string) =>
    api.post<ApiEnvelope<null>>("/auth/resend-verification", { email }),

  forgotPassword: (email: string) => api.post<ApiEnvelope<null>>("/auth/forgot-password", { email }),

  resetPassword: (payload: ResetPasswordFormValues & { token: string }) =>
    api.post<ApiEnvelope<null>>("/auth/reset-password", payload),
};
