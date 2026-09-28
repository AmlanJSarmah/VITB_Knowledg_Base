import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must not exceed 30 characters")
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      "Username may only contain alphanumeric characters, underscores, dashes, and periods"
    ),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
  name: z.string().trim().min(1, "Name cannot be empty").optional(),
  email: z
    .string()
    .trim()
    .email("Valid email address is required")
    .toLowerCase()
    .optional(),
  registrationNumber: z
    .string()
    .trim()
    .toUpperCase()
    .min(5, "Registration number must be at least 5 characters")
    .optional(),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
