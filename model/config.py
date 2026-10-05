from pathlib import Path

DOCS_DIR = Path("../server/uploads/")

CHAT_MODEL = "llama3.2:3b"          # or "llama3.2-3b-local" if you imported the GGUF manually
EMBED_MODEL = "nomic-embed-text"

DB_DIR = "chroma_db"                
COLLECTION = "docs"

CATEGORIES = ["notes", "books", "question-papers"]
PER_CATEGORY_K = 3                  

CHUNK_SIZE = 1000                   # characters per chunk
CHUNK_OVERLAP = 150