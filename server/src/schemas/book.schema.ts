import { z } from "zod";

export const createBookSchema = z.object({
  userId: z.string().uuid("Invalid user ID format").or(z.string().min(1, "User ID is required")),
  title: z.string().trim().min(1, "Book title is required"),
  fileUrl: z.string().trim().min(1, "File URL or path is required"),
  fileName: z.string().trim().min(1, "File name is required"),
  fileSize: z.coerce.number().int().positive("File size must be positive"),
  mimeType: z.string().trim().default("application/pdf"),
});

export const updateBookSchema = createBookSchema.partial().omit({ userId: true });

export const bookQuerySchema = z.object({
  title: z.string().trim().optional(),
  userId: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type BookQueryInput = z.infer<typeof bookQuerySchema>;
