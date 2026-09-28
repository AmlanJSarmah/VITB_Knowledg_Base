import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { uploadQuestionPaperMiddleware } from "../middleware/upload.middleware.js";
import { QuestionPaperController } from "../controllers/question-paper.controller.js";

export const questionPaperRouter = Router();

// POST /api/question-papers  — authenticated, PDF upload
questionPaperRouter.post(
  "/",
  authenticateToken,
  uploadQuestionPaperMiddleware,
  QuestionPaperController.uploadQuestionPaper
);

// GET /api/question-papers  — public, searchable by courseCode & year
questionPaperRouter.get("/", QuestionPaperController.getQuestionPapers);

// GET /api/question-papers/:id  — public
questionPaperRouter.get("/:id", QuestionPaperController.getQuestionPaperById);
