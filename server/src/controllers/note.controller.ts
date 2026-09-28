import { Request, Response } from "express";
import fs from "fs";
import prisma from "../lib/db.js";
import { noteQuerySchema } from "../schemas/note.schema.js";
import { z } from "zod";

const uploadNoteBodySchema = z.object({
  courseCode: z
    .string()
    .trim()
    .min(3, "Course code must be at least 3 characters")
    .toUpperCase(),
});

export const NoteController = {
  // POST /api/notes
  async uploadNote(req: Request, res: Response): Promise<void> {
    const file = req.file;

    try {
      if (!file) {
        res.status(400).json({ message: "PDF file is required in 'file' field" });
        return;
      }

      if (!req.user) {
        fs.unlinkSync(file.path);
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const parseResult = uploadNoteBodySchema.safeParse(req.body);
      if (!parseResult.success) {
        fs.unlinkSync(file.path);
        res.status(400).json({
          message: "Validation failed",
          errors: parseResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { courseCode } = parseResult.data;
      const fileUrl = `/uploads/notes/${file.filename}`;

      const note = await prisma.note.create({
        data: {
          userId: req.user.userId,
          courseCode,
          fileUrl,
          fileName: file.filename,
          fileSize: file.size,
          mimeType: file.mimetype || "application/pdf",
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              registrationNumber: true,
            },
          },
        },
      });

      res.status(201).json({
        message: "Note uploaded successfully",
        data: note,
      });
    } catch (error) {
      if (file && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch {
          // ignore cleanup error
        }
      }
      console.error("Error in uploadNote:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // GET /api/notes
  async getNotes(req: Request, res: Response): Promise<void> {
    try {
      const parseResult = noteQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        res.status(400).json({
          message: "Invalid query parameters",
          errors: parseResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { courseCode, userId, page, limit } = parseResult.data;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (courseCode) where.courseCode = courseCode;
      if (userId) where.userId = userId;

      const [total, items] = await Promise.all([
        prisma.note.count({ where }),
        prisma.note.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                registrationNumber: true,
              },
            },
          },
        }),
      ]);

      res.status(200).json({
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: items,
      });
    } catch (error) {
      console.error("Error in getNotes:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // GET /api/notes/:id
  async getNoteById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params["id"] as string;
      const note = await prisma.note.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              registrationNumber: true,
            },
          },
          chunks: {
            select: {
              id: true,
              chunkIndex: true,
              pageNumber: true,
            },
          },
        },
      });

      if (!note) {
        res.status(404).json({ message: "Note not found" });
        return;
      }

      res.status(200).json({ data: note });
    } catch (error) {
      console.error("Error in getNoteById:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};
