import { Request, Response } from "express";
import fs from "fs";
import prisma from "../lib/db.js";
import { questionPaperQuerySchema } from "../schemas/question-paper.schema.js";
import { z } from "zod";
import path from "path";

const uploadQuestionPaperBodySchema = z.object({
  courseCode: z
    .string()
    .trim()
    .min(3, "Course code must be at least 3 characters")
    .toUpperCase(),
  year: z.coerce
    .number()
    .int("Year must be an integer")
    .min(2000, "Year must be 2000 or later")
    .max(2100, "Year must be valid"),
});

export const QuestionPaperController = {
  // POST /api/question-papers
  async uploadQuestionPaper(req: Request, res: Response): Promise<void> {
    const file = req.file;

    try {
      if (!file) {
        res.status(400).json({ message: "PDF file is required in 'file' field" });
        return;
      }

      if (!req.user) {
        // Cleanup uploaded file
        fs.unlinkSync(file.path);
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const parseResult = uploadQuestionPaperBodySchema.safeParse(req.body);
      if (!parseResult.success) {
        // Cleanup uploaded file
        fs.unlinkSync(file.path);
        res.status(400).json({
          message: "Validation failed",
          errors: parseResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { courseCode, year } = parseResult.data;
      const fileUrl = `/uploads/question-papers/${file.filename}`;

      const questionPaper = await prisma.questionPaper.create({
        data: {
          userId: req.user.userId,
          courseCode,
          year,
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
        message: "Question paper uploaded successfully",
        data: questionPaper,
      });
    } catch (error) {
      if (file && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch {
          // ignore cleanup error
        }
      }
      console.error("Error in uploadQuestionPaper:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // GET /api/question-papers
  async getQuestionPapers(req: Request, res: Response): Promise<void> {
    try {
      const parseResult = questionPaperQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        res.status(400).json({
          message: "Invalid query parameters",
          errors: parseResult.error.flatten().fieldErrors,
        });
        return;
      }

      const { courseCode, year, userId, page, limit } = parseResult.data;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (courseCode) where.courseCode = courseCode;
      if (year) where.year = year;
      if (userId) where.userId = userId;

      const [total, items] = await Promise.all([
        prisma.questionPaper.count({ where }),
        prisma.questionPaper.findMany({
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
      console.error("Error in getQuestionPapers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // GET /api/question-papers/:id
  async getQuestionPaperById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params["id"] as string;
      const questionPaper = await prisma.questionPaper.findUnique({
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

      if (!questionPaper) {
        res.status(404).json({ message: "Question paper not found" });
        return;
      }

      res.status(200).json({ data: questionPaper });
    } catch (error) {
      console.error("Error in getQuestionPaperById:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // DELETE /api/question-papers/:id — owners may remove their resource
  async deleteQuestionPaper(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const id = req.params["id"] as string;
      const paper = await prisma.questionPaper.findFirst({ where: { id, userId: req.user.userId } });
      if (!paper) {
        res.status(404).json({ message: "Resource not found" });
        return;
      }
      await prisma.questionPaper.delete({ where: { id: paper.id } });
      const uploadsRoot = path.resolve(process.cwd(), "uploads", "question-papers");
      const filePath = path.resolve(process.cwd(), paper.fileUrl.replace(/^\/+/, ""));
      if (filePath.startsWith(`${uploadsRoot}${path.sep}`) && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      res.status(200).json({ message: "Question paper deleted successfully" });
    } catch (error) {
      console.error("Error in deleteQuestionPaper:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};
