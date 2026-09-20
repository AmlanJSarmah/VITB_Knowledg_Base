import { z } from "zod";

export const createNoteSchema = z.object({
  userId: z.string().uuid("Invalid user ID format").or(z.string().min(1, "User ID is required")),
  courseCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, "Course code must be at least 3 characters")
    .regex(/^[A-Z]{2,4}\d{3,5}[A-Z]?$/, "Course code should match format like MAT10001, CSE2001, etc."),
  fileUrl: z.string().trim().min(1, "File URL or path is required"),
  fileName: z.string().trim().min(1, "File name is required"),
  fileSize: z.coerce.number().int().positive("File size must be positive"),
  mimeType: z.string().trim().default("application/pdf"),
});

export const updateNoteSchema = createNoteSchema.partial().omit({ userId: true });

export const noteQuerySchema = z.object({
  courseCode: z
    .string()
    .trim()
    .toUpperCase()
    .optional(),
  userId: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type NoteQueryInput = z.infer<typeof noteQuerySchema>;
