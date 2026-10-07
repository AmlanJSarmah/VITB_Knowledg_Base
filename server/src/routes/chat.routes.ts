import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticateToken } from "../middleware/auth.middleware.js";

export const chatRouter = Router();

const chatRequestSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(2000),
  })).max(30).default([]),
  categories: z.array(z.enum(["notes", "books", "question-papers"])).optional(),
});

// The wrapper key stays on the server; the browser only talks to this authenticated endpoint.
chatRouter.post("/query", authenticateToken, async (req: Request, res: Response) => {
  const parsed = chatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid chat request", errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const wrapperUrl = (process.env.MODEL_API_URL || "http://localhost:8000").replace(/\/+$/, "");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const apiKey = process.env.WRAPPER_API_KEY;
  if (apiKey) headers["X-API-Key"] = apiKey;

  try {
    const upstream = await fetch(`${wrapperUrl}/query`, {
      method: "POST",
      headers,
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(120_000),
    });
    const payload = await upstream.json().catch(() => ({})) as {
      answer?: string;
      sources?: unknown[];
      detail?: string;
    };
    if (!upstream.ok) {
      res.status(upstream.status >= 500 ? 502 : upstream.status).json({
        message: payload.detail || "The AI Tutor could not process that question.",
      });
      return;
    }
    res.json({ answer: payload.answer ?? "", sources: payload.sources ?? [] });
  } catch (error) {
    console.error("AI Tutor wrapper request failed:", error);
    res.status(502).json({ message: "The AI Tutor is unavailable. Check that the model service is running and try again." });
  }
});
