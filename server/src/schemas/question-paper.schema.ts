import { z } from "zod";

export const createQuestionPaperSchema = z.object({
  userId: z.string().uuid("Invalid user ID format").or(z.string().min(1, "User ID is required")),
  courseCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, "Course code must be at least 3 characters")
    .regex(/^[A-Z]{2,4}\d{3,5}[A-Z]?$/, "Course code should match format like MAT10001, CSE2001, etc."),
  year: z
    .coerce
    .number()
    .int("Year must be an integer")
    .min(2000, "Year must be 2000 or later")
    .max(2100, "Year must be valid"),
  fileUrl: z.string().trim().min(1, "File URL or path is required"),
  fileName: z.string().trim().min(1, "File name is required"),
  fileSize: z.coerce.number().int().positive("File size must be positive"),
  mimeType: z.string().trim().default("application/pdf"),
});

export const updateQuestionPaperSchema = createQuestionPaperSchema.partial().omit({ userId: true });

export const questionPaperQuerySchema = z.object({
  courseCode: z
    .string()
    .trim()
    .toUpperCase()
    .optional(),
  year: z.coerce.number().int().optional(),
  userId: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateQuestionPaperInput = z.infer<typeof createQuestionPaperSchema>;
export type UpdateQuestionPaperInput = z.infer<typeof updateQuestionPaperSchema>;
export type QuestionPaperQueryInput = z.infer<typeof questionPaperQuerySchema>;
