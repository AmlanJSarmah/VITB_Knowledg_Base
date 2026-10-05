"""Shared RAG logic: retrieval across all categories + prompt building."""
import ollama
import chromadb

from config import *

SYSTEM = (
    "You are a study assistant. Answer using ONLY the context provided. "
    "Each context block is labelled with its category (notes, books or question-papers), "
    "file and page. Use question-papers to understand what is asked in exams, and notes/books "
    "for explanations. If the answer is not in the context, say you don't know. "
    "Be concise and mention the source file and page when useful."
)

_client = chromadb.PersistentClient(path=DB_DIR)


def get_collection():
    return _client.get_or_create_collection(COLLECTION, metadata={"hnsw:space": "cosine"})


def retrieve(question: str, categories: list[str] | None = None) -> list[dict]:
    """Search each category separately, then merge by similarity.

    Querying per category stops the huge `books` folder from crowding out
    `notes` and `question-papers`.
    """
    col = get_collection()
    q_emb = ollama.embed(model=EMBED_MODEL, input=[f"search_query: {question}"])["embeddings"]

    hits = []
    for cat in categories or CATEGORIES:
        res = col.query(query_embeddings=q_emb, n_results=PER_CATEGORY_K, where={"category": cat})
        for doc, meta, dist in zip(res["documents"][0], res["metadatas"][0], res["distances"][0]):
            hits.append({
                "text": doc,
                "category": cat,
                "source": meta["source"],
                "page": meta["page"],
                "distance": round(dist, 4),
            })
    hits.sort(key=lambda h: h["distance"])
    return hits


def build_messages(question: str, hits: list[dict], history: list[dict] | None = None) -> list[dict]:
    context = "\n\n".join(
        f"[{h['category']} | {h['source']} p.{h['page']}]\n{h['text']}" for h in hits
    )
    return [
        {"role": "system", "content": SYSTEM},
        *(history or []),
        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"},
    ]


def sources_of(hits: list[dict]) -> list[dict]:
    return [{k: h[k] for k in ("category", "source", "page", "distance")} for h in hits]