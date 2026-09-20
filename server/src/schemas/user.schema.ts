import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Valid email address is required").toLowerCase(),
  registrationNumber: z
    .string()
    .trim()
    .toUpperCase()
    .min(5, "Registration number must be at least 5 characters")
    .optional(),
});

export const updateUserSchema = createUserSchema.partial();

export const userQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
