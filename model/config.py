from pathlib import Path

DOCS_DIR = Path("../server/uploads")

CHAT_MODEL = "llama3.2:3b"          # use "llama3.1:8b" or "qwen2.5:7b" if you have 16GB+ RAM
EMBED_MODEL = "nomic-embed-text"

DB_DIR = "chroma_db"                
COLLECTION = "docs"

# characters per chunk
CHUNK_SIZE = 1000                   
CHUNK_OVERLAP = 150
TOP_K = 5