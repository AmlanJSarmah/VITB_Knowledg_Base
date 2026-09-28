import http from "http";
import path from "path";
import fs from "fs";
import FormData from "form-data";
import app from "./src/index.js";
import prisma from "./src/lib/db.js";

const TEST_PORT = 3002;
const TEST_PDF_PATH = path.join(process.cwd(), "scratch", "test.pdf");

// ── helpers ──────────────────────────────────────────────────────────────────

function request(
  method: string,
  urlPath: string,
  body?: any,
  token?: string
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: TEST_PORT,
        path: urlPath,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode || 500, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode || 500, body: data });
          }
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function multipartRequest(
  urlPath: string,
  fields: Record<string, string>,
  filePath: string,
  fileField: string,
  token: string
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    for (const [key, val] of Object.entries(fields)) form.append(key, val);
    form.append(fileField, fs.createReadStream(filePath), {
      filename: path.basename(filePath),
      contentType: "application/pdf",
    });

    const headers = {
      ...form.getHeaders(),
      Authorization: `Bearer ${token}`,
    };
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: TEST_PORT,
        path: urlPath,
        method: "POST",
        headers,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode || 500, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode || 500, body: data });
          }
        });
      }
    );
    req.on("error", reject);
    form.pipe(req);
  });
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌  ${message}`);
    process.exit(1);
  }
  console.log(`✅  ${message}`);
}

function createMinimalPdf(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // Minimal valid PDF bytes
  fs.writeFileSync(
    filePath,
    "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n212\n%%EOF"
  );
}

// ── main ─────────────────────────────────────────────────────────────────────

const testUsername = `upload_test_${Date.now()}`;
const testPassword = "uploadpass123";
let token = "";
let qpId = "", noteId = "", bookId = "";

async function runTests() {
  console.log("--- Starting Upload Integration Tests ---\n");
  createMinimalPdf(TEST_PDF_PATH);
  const server = app.listen(TEST_PORT);

  try {
    // 1. Register & Login
    const regRes = await request("POST", "/api/auth/register", {
      username: testUsername, password: testPassword,
    });
    assert(regRes.status === 201, "Test user registered (201)");
    token = regRes.body.token;

    // ── Question Paper ─────────────────────────────────────────────────────

    // 2. Upload question paper
    const qpRes = await multipartRequest(
      "/api/question-papers",
      { courseCode: "MAT10001", year: "2026" },
      TEST_PDF_PATH, "file", token
    );
    assert(qpRes.status === 201, "Question paper uploaded (201)");
    assert(qpRes.body.data.courseCode === "MAT10001", "QP courseCode is correct");
    assert(qpRes.body.data.year === 2026, "QP year is correct");
    qpId = qpRes.body.data.id;

    // 3. Query question papers by courseCode + year
    const qpList = await request("GET", "/api/question-papers?courseCode=MAT10001&year=2026");
    assert(qpList.status === 200, "GET /api/question-papers returns 200");
    assert(qpList.body.data.length >= 1, "QP query returns at least 1 result");

    // 4. Get question paper by ID
    const qpGet = await request("GET", `/api/question-papers/${qpId}`);
    assert(qpGet.status === 200, "GET /api/question-papers/:id returns 200");
    assert(qpGet.body.data.id === qpId, "QP by ID returns correct record");

    // 5. Reject QP upload without auth
    const qpNoAuth = await multipartRequest(
      "/api/question-papers",
      { courseCode: "MAT10001", year: "2026" },
      TEST_PDF_PATH, "file", "invalid_token"
    );
    assert(qpNoAuth.status === 401, "QP upload without valid token returns 401");

    // 6. Reject QP upload with missing courseCode
    const qpBadBody = await multipartRequest(
      "/api/question-papers",
      { year: "2026" },
      TEST_PDF_PATH, "file", token
    );
    assert(qpBadBody.status === 400, "QP upload missing courseCode returns 400");

    // ── Note ───────────────────────────────────────────────────────────────

    // 7. Upload note
    const noteRes = await multipartRequest(
      "/api/notes",
      { courseCode: "MAT10001" },
      TEST_PDF_PATH, "file", token
    );
    assert(noteRes.status === 201, "Note uploaded (201)");
    assert(noteRes.body.data.courseCode === "MAT10001", "Note courseCode is correct");
    noteId = noteRes.body.data.id;

    // 8. Query notes by courseCode
    const noteList = await request("GET", "/api/notes?courseCode=MAT10001");
    assert(noteList.status === 200, "GET /api/notes returns 200");
    assert(noteList.body.data.length >= 1, "Note query returns at least 1 result");

    // 9. Get note by ID
    const noteGet = await request("GET", `/api/notes/${noteId}`);
    assert(noteGet.status === 200, "GET /api/notes/:id returns 200");

    // 10. Reject note upload missing courseCode
    const noteBadBody = await multipartRequest(
      "/api/notes", {}, TEST_PDF_PATH, "file", token
    );
    assert(noteBadBody.status === 400, "Note upload missing courseCode returns 400");

    // ── Book ───────────────────────────────────────────────────────────────

    // 11. Upload book
    const bookRes = await multipartRequest(
      "/api/books",
      { title: "Calculus Early Transcendentals" },
      TEST_PDF_PATH, "file", token
    );
    assert(bookRes.status === 201, "Book uploaded (201)");
    assert(bookRes.body.data.title === "Calculus Early Transcendentals", "Book title is correct");
    bookId = bookRes.body.data.id;

    // 12. Query books by title (partial, case-insensitive)
    const bookList = await request("GET", "/api/books?title=calculus");
    assert(bookList.status === 200, "GET /api/books returns 200");
    assert(bookList.body.data.length >= 1, "Book title search returns at least 1 result");

    // 13. Get book by ID
    const bookGet = await request("GET", `/api/books/${bookId}`);
    assert(bookGet.status === 200, "GET /api/books/:id returns 200");

    // 14. Reject book upload missing title
    const bookBadBody = await multipartRequest(
      "/api/books", {}, TEST_PDF_PATH, "file", token
    );
    assert(bookBadBody.status === 400, "Book upload missing title returns 400");

    console.log("\n🎉 All upload integration tests passed successfully!");
  } finally {
    // Cleanup test records from DB
    if (qpId) await prisma.questionPaper.delete({ where: { id: qpId } }).catch(() => {});
    if (noteId) await prisma.note.delete({ where: { id: noteId } }).catch(() => {});
    if (bookId) await prisma.book.delete({ where: { id: bookId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { username: testUsername } }).catch(() => {});
    // Cleanup scratch PDF
    if (fs.existsSync(TEST_PDF_PATH)) fs.unlinkSync(TEST_PDF_PATH);
    console.log("🧹 Test records and files cleaned up.");
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
