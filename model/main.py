"""Wrapper API: exposes the RAG pipeline over HTTP for the Core API.

Run:  uvicorn main:app --reload --port 8000
Docs: http://localhost:8000/docs
"""
import json
import os
from typing import Literal

import ollama
from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

import ingest
import rag
from config import *


def check_api_key(x_api_key: str | None = Header(default=None)):
    """If WRAPPER_API_KEY is set, the Core API must send it as X-API-Key."""
    expected = os.getenv("WRAPPER_API_KEY")
    if expected and x_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid API key")


app = FastAPI(title="RAG Wrapper API", dependencies=[Depends(check_api_key)])
llm = ollama.AsyncClient()


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class QueryRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    history: list[Message] = []
    categories: list[str] | None = None  # None = search notes, books AND question-papers


class IngestRequest(BaseModel):
    path: str  # relative to DOCS_DIR, e.g. "notes/os.pdf" or "books"


def _prepare(req: QueryRequest):
    history = [m.model_dump() for m in req.history[-6:]]  # keep the last few turns only
    return req.question, history


@app.get("/health")
async def health():
    count = await run_in_threadpool(lambda: rag.get_collection().count())
    return {"status": "ok", "chunks": count, "chat_model": CHAT_MODEL}


@app.post("/query")
async def query(req: QueryRequest):
    """Non-streaming: returns the full answer as JSON."""
    question, history = _prepare(req)
    hits = await run_in_threadpool(rag.retrieve, question, req.categories)
    resp = await llm.chat(model=CHAT_MODEL, messages=rag.build_messages(question, hits, history))
    return {"answer": resp["message"]["content"], "sources": rag.sources_of(hits)}


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@app.post("/query/stream")
async def query_stream(req: QueryRequest):
    """Server-Sent Events: `sources` first, then many `token` events, then `done`."""
    question, history = _prepare(req)

    async def events():
        try:
            hits = await run_in_threadpool(rag.retrieve, question, req.categories)
            yield _sse("sources", {"sources": rag.sources_of(hits)})
            messages = rag.build_messages(question, hits, history)
            async for part in await llm.chat(model=CHAT_MODEL, messages=messages, stream=True):
                yield _sse("token", {"text": part["message"]["content"]})
            yield _sse("done", {})
        except Exception as e:  # surface the error to the client instead of a dropped connection
            yield _sse("error", {"detail": str(e)})

    return StreamingResponse(events(), media_type="text/event-stream")


def _resolve(path: str):
    root = DOCS_DIR.resolve()
    target = (root / path).resolve()
    if not target.is_relative_to(root):  # block ../ path traversal
        raise HTTPException(status_code=400, detail="Path outside documents directory")
    return root, target


@app.post("/ingest", status_code=202)
async def ingest_documents(req: IngestRequest, background: BackgroundTasks):
    """Core API calls this after saving an upload. Runs in the background."""
    _, target = _resolve(req.path)
    if not target.exists():
        raise HTTPException(status_code=404, detail="Path not found")
    background.add_task(ingest.ingest_path, target)
    return {"status": "queued", "path": req.path}


@app.delete("/documents/{path:path}")
async def delete_document(path: str):
    """Core API calls this when a file is deleted, so stale chunks stop being retrieved."""
    root, target = _resolve(path)
    rel = str(target.relative_to(root))
    await run_in_threadpool(lambda: rag.get_collection().delete(where={"source": rel}))
    return {"status": "deleted", "path": rel}