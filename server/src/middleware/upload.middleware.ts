import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

// Ensure directory exists
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Allowed MIME types for PDF
const ALLOWED_MIME_TYPES = ["application/pdf"];

// Generic storage creator for material categories
export function createPdfUploader(subDirectory: "question-papers" | "notes" | "books") {
  const targetDir = path.join(UPLOADS_ROOT, subDirectory);
  ensureDirectoryExists(targetDir);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureDirectoryExists(targetDir);
      cb(null, targetDir);
    },
    filename: (_req, file, cb) => {
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(sanitizedName).toLowerCase() || ".pdf";
      const base = path.basename(sanitizedName, ext);
      cb(null, `${base}-${uniqueSuffix}${ext}`);
    },
  });

  const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME_TYPES.includes(file.mimetype) || ext === ".pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB max file size
    },
  });
}

// Multer error handling wrapper
export function handleUpload(
  uploader: multer.Multer,
  fieldName = "file"
) {
  const uploadSingle = uploader.single(fieldName);

  return (req: Request, res: Response, next: NextFunction): void => {
    uploadSingle(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({
            message: "File size exceeds the 50MB limit",
          });
          return;
        }
        res.status(400).json({
          message: `Upload error: ${err.message}`,
        });
        return;
      } else if (err) {
        res.status(400).json({
          message: err.message || "Failed to upload file",
        });
        return;
      }
      next();
    });
  };
}

export const uploadQuestionPaperMiddleware = handleUpload(
  createPdfUploader("question-papers")
);

export const uploadNoteMiddleware = handleUpload(
  createPdfUploader("notes")
);

export const uploadBookMiddleware = handleUpload(
  createPdfUploader("books")
);
