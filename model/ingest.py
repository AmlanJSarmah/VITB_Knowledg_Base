"""Read PDFs, chunk them, embed them, store them in Chroma.

CLI:  python ingest.py            (everything)
      python ingest.py notes      (one subfolder)
Also imported by main.py for the /ingest endpoint.
"""
import argparse
import sys
from pathlib import Path

import fitz  # PyMuPDF
import ollama

from config import *
from rag import get_collection


def chunk_text(text: str, size: int, overlap: int):
    text = " ".join(text.split())  # normalise whitespace
    chunks, start = [], 0
    while start < len(text):
        end = min(start + size, len(text))
        chunks.append(text[start:end])
        if end == len(text):
            break
        start = end - overlap
    return chunks


def embed(texts):
    # nomic-embed-text expects a task prefix
    inputs = [f"search_document: {t}" for t in texts]
    return ollama.embed(model=EMBED_MODEL, input=inputs)["embeddings"]


def ingest_file(pdf: Path, col) -> int:
    """Ingest one PDF. Returns number of chunks stored (0 = nothing extractable)."""
    rel_path = pdf.resolve().relative_to(DOCS_DIR.resolve())
    rel = str(rel_path)
    parts = rel_path.parts
    category = parts[0] if len(parts) > 1 else "root"  # books / notes / question-papers

    col.delete(where={"source": rel})  # re-ingesting replaces old chunks

    ids, docs, metas = [], [], []
    with fitz.open(pdf) as doc:
        for page_no, page in enumerate(doc, start=1):
            text = page.get_text()
            if not text.strip():
                continue  # blank or scanned page (needs OCR)
            for i, chunk in enumerate(chunk_text(text, CHUNK_SIZE, CHUNK_OVERLAP)):
                ids.append(f"{rel}::p{page_no}::c{i}")
                docs.append(chunk)
                metas.append({"source": rel, "page": page_no, "category": category})

    for b in range(0, len(docs), 32):  # embed in batches
        col.add(
            ids=ids[b:b + 32],
            documents=docs[b:b + 32],
            metadatas=metas[b:b + 32],
            embeddings=embed(docs[b:b + 32]),
        )
    return len(docs)


def ingest_path(target: Path) -> None:
    """Ingest a single PDF or every PDF under a folder."""
    pdfs = [target] if target.is_file() else sorted(target.rglob("*.pdf"))
    if not pdfs:
        print(f"No PDFs found in {target}")
        return
    col = get_collection()
    for pdf in pdfs:
        n = ingest_file(pdf, col)
        name = pdf.relative_to(DOCS_DIR) if pdf.is_relative_to(DOCS_DIR) else pdf
        print(f"[ok] {name}: {n} chunks" if n else f"[skip] {name}: no extractable text (scanned PDF?)")
    print(f"Done. Total chunks in DB: {col.count()}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("folder", nargs="?", default="",
                        help="optional subfolder of DOCS_DIR to ingest, e.g. notes")
    args = parser.parse_args()
    root = DOCS_DIR / args.folder
    if not root.exists():
        sys.exit(f"{root} does not exist")
    ingest_path(root)