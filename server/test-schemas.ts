import {
  createUserSchema,
  createQuestionPaperSchema,
  createNoteSchema,
  createBookSchema,
  questionPaperQuerySchema,
  noteQuerySchema,
  bookQuerySchema,
  createDocumentChunkSchema,
} from "./src/schemas/index.js";
import type {
  User,
  QuestionPaper,
  Note,
  Book,
  DocumentChunk,
  ProcessingStatus,
} from "@prisma/client";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

console.log("--- Running Schema & Validation Tests ---\n");

// 1. Test User Schema
const validUserData = {
  name: "Amlan Sarmah",
  email: "student@vitbhopal.ac.in",
  registrationNumber: "22BCI10001",
};
const parsedUser = createUserSchema.safeParse(validUserData);
assert(parsedUser.success, "Valid User parses successfully");

const invalidUser = createUserSchema.safeParse({ name: "Amlan", email: "invalid-email" });
assert(!invalidUser.success, "Invalid user email is rejected");

// 2. Test QuestionPaper Schema
const validQP = {
  userId: "c8e03e54-52d3-488f-a9eb-efefdca820f1",
  courseCode: "MAT10001",
  year: 2026,
  fileUrl: "https://storage.vitb.edu/qp/mat10001-2026.pdf",
  fileName: "mat10001-2026.pdf",
  fileSize: 1048576,
  mimeType: "application/pdf",
};
const parsedQP = createQuestionPaperSchema.safeParse(validQP);
assert(parsedQP.success, "Valid QuestionPaper (courseCode + year) parses successfully");

const missingYearQP = createQuestionPaperSchema.safeParse({
  userId: "c8e03e54-52d3-488f-a9eb-efefdca820f1",
  courseCode: "MAT10001",
  fileUrl: "https://storage.vitb.edu/qp/mat10001.pdf",
  fileName: "mat10001.pdf",
  fileSize: 1048576,
});
assert(!missingYearQP.success, "QuestionPaper missing year is rejected");

const missingCourseCodeQP = createQuestionPaperSchema.safeParse({
  userId: "c8e03e54-52d3-488f-a9eb-efefdca820f1",
  year: 2026,
  fileUrl: "https://storage.vitb.edu/qp/mat10001.pdf",
  fileName: "mat10001.pdf",
  fileSize: 1048576,
});
assert(!missingCourseCodeQP.success, "QuestionPaper missing courseCode is rejected");

// 3. Test Note Schema
const validNote = {
  userId: "c8e03e54-52d3-488f-a9eb-efefdca820f1",
  courseCode: "MAT10001",
  fileUrl: "https://storage.vitb.edu/notes/mat10001.pdf",
  fileName: "mat10001-notes.pdf",
  fileSize: 524288,
};
const parsedNote = createNoteSchema.safeParse(validNote);
assert(parsedNote.success, "Valid Note (courseCode only) parses successfully");

const missingCourseCodeNote = createNoteSchema.safeParse({
  userId: "c8e03e54-52d3-488f-a9eb-efefdca820f1",
  fileUrl: "https://storage.vitb.edu/notes/mat10001.pdf",
  fileName: "mat10001-notes.pdf",
  fileSize: 524288,
});
assert(!missingCourseCodeNote.success, "Note missing courseCode is rejected");

// 4. Test Book Schema
const validBook = {
  userId: "c8e03e54-52d3-488f-a9eb-efefdca820f1",
  title: "Thomas' Calculus 14th Edition",
  fileUrl: "https://storage.vitb.edu/books/thomas-calculus.pdf",
  fileName: "thomas-calculus.pdf",
  fileSize: 20971520,
};
const parsedBook = createBookSchema.safeParse(validBook);
assert(parsedBook.success, "Valid Book (title only) parses successfully");

const missingTitleBook = createBookSchema.safeParse({
  userId: "c8e03e54-52d3-488f-a9eb-efefdca820f1",
  fileUrl: "https://storage.vitb.edu/books/thomas-calculus.pdf",
  fileName: "thomas-calculus.pdf",
  fileSize: 20971520,
});
assert(!missingTitleBook.success, "Book missing title is rejected");

// 5. Test Search Queries
// "search for question papers of course code MAT10001 of year 2026"
const qpSearch = questionPaperQuerySchema.safeParse({
  courseCode: "mat10001",
  year: "2026",
});
assert(qpSearch.success, "Search QP by courseCode + year parses correctly");
if (qpSearch.success) {
  assert(
    qpSearch.data.courseCode === "MAT10001" && qpSearch.data.year === 2026,
    "Search QP auto-normalizes uppercase courseCode and coerces year to number"
  );
}

// 6. Test DocumentChunk (LLM RAG)
const validChunk = {
  questionPaperId: "qp-uuid-1",
  chunkIndex: 0,
  pageNumber: 1,
  content: "Q1. Find the eigenvalues of the matrix...",
};
const parsedChunk = createDocumentChunkSchema.safeParse(validChunk);
assert(parsedChunk.success, "Valid DocumentChunk for QuestionPaper parses successfully");

const invalidChunkNoSource = createDocumentChunkSchema.safeParse({
  chunkIndex: 0,
  content: "Orphan chunk without source material",
});
assert(!invalidChunkNoSource.success, "Chunk without parent material ID is rejected");

console.log("\n🎉 All schema validations and constraints verified successfully!");
