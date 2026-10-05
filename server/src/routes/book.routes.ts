import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { uploadBookMiddleware } from "../middleware/upload.middleware.js";
import { BookController } from "../controllers/book.controller.js";

export const bookRouter = Router();

// POST /api/books  — authenticated, PDF upload
bookRouter.post(
  "/",
  authenticateToken,
  uploadBookMiddleware,
  BookController.uploadBook
);

// GET /api/books  — public, searchable by title
bookRouter.get("/", BookController.getBooks);

// GET /api/books/:id  — public
bookRouter.get("/:id", BookController.getBookById);

// DELETE /api/books/:id — authenticated, owner only
bookRouter.delete("/:id", authenticateToken, BookController.deleteBook);
