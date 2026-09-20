import { z } from "zod";

export const createDocumentChunkSchema = z
  .object({
    questionPaperId: z.string().optional(),
    noteId: z.string().optional(),
    bookId: z.string().optional(),
    chunkIndex: z.coerce.number().int().min(0, "Chunk index must be >= 0"),
    pageNumber: z.coerce.number().int().min(1).optional(),
    content: z.string().min(1, "Chunk content cannot be empty"),
    tokenCount: z.coerce.number().int().positive().optional(),
  })
  .refine(
    (data) => Boolean(data.questionPaperId || data.noteId || data.bookId),
    {
      message:
        "At least one material ID (questionPaperId, noteId, or bookId) must be specified for a document chunk",
    }
  );

export type CreateDocumentChunkInput = z.infer<typeof createDocumentChunkSchema>;
