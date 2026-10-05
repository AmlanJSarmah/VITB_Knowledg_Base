"""Read every PDF in DOCS_DIR, chunk it, embed it, store it in Chroma."""
import argparse
import sys
import fitz  # PyMuPDF
import ollama
import chromadb

from config import *


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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("folder", nargs="?", default="",
                        help="optional subfolder of DOCS_DIR to ingest, e.g. notes")
    args = parser.parse_args()

    root = DOCS_DIR / args.folder
    pdfs = sorted(root.rglob("*.pdf"))
    if not pdfs:
        sys.exit(f"No PDFs found in {root}")

    client = chromadb.PersistentClient(path=DB_DIR)
    col = client.get_or_create_collection(COLLECTION, metadata={"hnsw:space": "cosine"})

    for pdf in pdfs:
        rel = str(pdf.relative_to(DOCS_DIR))
        parts = pdf.relative_to(DOCS_DIR).parts
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

        if not docs:
            print(f"[skip] {rel}: no extractable text (scanned PDF?)")
            continue

        for b in range(0, len(docs), 32):  # embed in batches
            col.add(
                ids=ids[b:b + 32],
                documents=docs[b:b + 32],
                metadatas=metas[b:b + 32],
                embeddings=embed(docs[b:b + 32]),
            )
        print(f"[ok] {rel}: {len(docs)} chunks")

    print(f"Done. Total chunks in DB: {col.count()}")


if __name__ == "__main__":
    main()