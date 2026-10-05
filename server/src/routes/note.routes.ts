import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { uploadNoteMiddleware } from "../middleware/upload.middleware.js";
import { NoteController } from "../controllers/note.controller.js";

export const noteRouter = Router();

// POST /api/notes  — authenticated, PDF upload
noteRouter.post(
  "/",
  authenticateToken,
  uploadNoteMiddleware,
  NoteController.uploadNote
);

// GET /api/notes  — public, searchable by courseCode
noteRouter.get("/", NoteController.getNotes);

// GET /api/notes/:id  — public
noteRouter.get("/:id", NoteController.getNoteById);

// DELETE /api/notes/:id — authenticated, owner only
noteRouter.delete("/:id", authenticateToken, NoteController.deleteNote);
