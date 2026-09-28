import { Request, Response } from "express";
import fs from "fs";
import prisma from "../lib/db.js";
import { bookQuerySchema } from "../schemas/book.schema.js";
import { z } from "zod";

const uploadBookBodySchema = z.object({
  title: z.string().trim().min(1, "Book title is required"),
});

export const BookController = {
  // POST /api/books
  async uploadBook(req: Request, res: Response): Promise<void> {
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

      const parseResult = uploadBookBodySchema.safeParse(req.body);
      if (!parseResult.success) {
        fs.unlinkSync(file.path);
        res.status(400).json({
          message: "Validation failed",
          errors: parseResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { title } = parseResult.data;
      const fileUrl = `/uploads/books/${file.filename}`;

      const book = await prisma.book.create({
        data: {
          userId: req.user.userId,
          title,
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
        message: "Book uploaded successfully",
        data: book,
      });
    } catch (error) {
      if (file && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch {
          // ignore cleanup error
        }
      }
      console.error("Error in uploadBook:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // GET /api/books
  async getBooks(req: Request, res: Response): Promise<void> {
    try {
      const parseResult = bookQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        res.status(400).json({
          message: "Invalid query parameters",
          errors: parseResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { title, userId, page, limit } = parseResult.data;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (title) {
        where.title = {
          contains: title,
          mode: "insensitive",
        };
      }
      if (userId) where.userId = userId;

      const [total, items] = await Promise.all([
        prisma.book.count({ where }),
        prisma.book.findMany({
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
      console.error("Error in getBooks:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // GET /api/books/:id
  async getBookById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params["id"] as string;
      const book = await prisma.book.findUnique({
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

      if (!book) {
        res.status(404).json({ message: "Book not found" });
        return;
      }

      res.status(200).json({ data: book });
    } catch (error) {
      console.error("Error in getBookById:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};
