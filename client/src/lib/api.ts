// Centralized API helpers. All requests use the Vite proxy (/api -> localhost:3000).
// Token is read lazily from localStorage so it's always up to date.

const BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("vitb_kb_token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (json as { message?: string }).message || `HTTP ${res.status}`
    );
  }
  return json as T;
}

// ── Question Papers ─────────────────────────────────────────────────────────

export interface QuestionPaper {
  id: string;
  courseCode: string;
  year: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  processingStatus: string;
  createdAt: string;
  user: { id: string; username: string; name: string | null; registrationNumber: string | null };
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: T[];
}

export async function uploadQuestionPaper(
  formData: FormData
): Promise<{ message: string; data: QuestionPaper }> {
  const res = await fetch(`${BASE}/question-papers`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  return handleResponse(res);
}

export async function getQuestionPapers(params: {
  courseCode?: string;
  year?: number;
  userId?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<QuestionPaper>> {
  const qs = new URLSearchParams();
  if (params.courseCode) qs.set("courseCode", params.courseCode);
  if (params.year) qs.set("year", String(params.year));
  if (params.userId) qs.set("userId", params.userId);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const res = await fetch(`${BASE}/question-papers?${qs}`);
  return handleResponse(res);
}

// ── Notes ────────────────────────────────────────────────────────────────────

export interface Note {
  id: string;
  courseCode: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  processingStatus: string;
  createdAt: string;
  user: { id: string; username: string; name: string | null; registrationNumber: string | null };
}

export async function uploadNote(
  formData: FormData
): Promise<{ message: string; data: Note }> {
  const res = await fetch(`${BASE}/notes`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  return handleResponse(res);
}

export async function getNotes(params: {
  courseCode?: string;
  userId?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Note>> {
  const qs = new URLSearchParams();
  if (params.courseCode) qs.set("courseCode", params.courseCode);
  if (params.userId) qs.set("userId", params.userId);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const res = await fetch(`${BASE}/notes?${qs}`);
  return handleResponse(res);
}

// ── Books ────────────────────────────────────────────────────────────────────

export interface Book {
  id: string;
  title: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  processingStatus: string;
  createdAt: string;
  user: { id: string; username: string; name: string | null; registrationNumber: string | null };
}

export async function uploadBook(
  formData: FormData
): Promise<{ message: string; data: Book }> {
  const res = await fetch(`${BASE}/books`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  return handleResponse(res);
}

export async function getBooks(params: {
  title?: string;
  userId?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Book>> {
  const qs = new URLSearchParams();
  if (params.title) qs.set("title", params.title);
  if (params.userId) qs.set("userId", params.userId);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const res = await fetch(`${BASE}/books?${qs}`);
  return handleResponse(res);
}

export async function deleteQuestionPaper(id: string): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/question-papers/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function deleteNote(id: string): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/notes/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function deleteBook(id: string): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/books/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ── Utilities ────────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
