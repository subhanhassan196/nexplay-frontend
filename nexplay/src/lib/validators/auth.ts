import { z } from "zod";

/**
 * Mirrors src/validators/auth.validator.ts on the backend. Keep both
 * in sync if the password/username policy changes — the backend is
 * always the source of truth; this copy exists purely so the frontend
 * can validate and show a strength meter before hitting the network.
 */
export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "Must be under 72 characters")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[0-9]/, "Add a number")
  .regex(/[^A-Za-z0-9]/, "Add a special character");

export const usernameSchema = z
  .string()
  .min(3, "At least 3 characters")
  .max(20, "Under 20 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only");

export const registerSchema = z
  .object({
    username: usernameSchema,
    email: z.string().email("Enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
    agreeToTerms: z.literal(true, {
      errorMap: () => ({ message: "You must agree to the Terms and Privacy Policy" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.input<typeof loginSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

/**
 * 0-4 password strength score used by <PasswordStrengthMeter />.
 */
export function getPasswordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) && password.length >= 12) score++;

  const levels = [
    { label: "Very Weak", color: "bg-danger" },
    { label: "Weak", color: "bg-danger" },
    { label: "Fair", color: "bg-accent" },
    { label: "Good", color: "bg-secondary" },
    { label: "Strong", color: "bg-success" },
  ] as const;

  return { score: score as 0 | 1 | 2 | 3 | 4, ...levels[score] };
}
