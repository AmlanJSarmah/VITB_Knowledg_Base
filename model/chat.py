"""Terminal chatbot: retrieve relevant chunks, ask the local LLM, show sources."""
import argparse
import ollama
import chromadb

from config import *

SYSTEM = (
    "You answer questions using ONLY the context provided. "
    "If the answer is not in the context, say you don't know. "
    "Be concise and mention the source file and page when useful."
)


def retrieve(question: str, category: str | None = None):
    col = chromadb.PersistentClient(path=DB_DIR).get_collection(COLLECTION)
    q_emb = ollama.embed(model=EMBED_MODEL, input=[f"search_query: {question}"])["embeddings"]
    where = {"category": category} if category else None
    res = col.query(query_embeddings=q_emb, n_results=TOP_K, where=where)
    return list(zip(res["documents"][0], res["metadatas"][0], res["distances"][0]))


def answer(question: str, category: str | None = None):
    hits = retrieve(question, category)
    context = "\n\n".join(
        f"[{m['source']} p.{m['page']}]\n{d}" for d, m, _ in hits
    )
    messages = [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"},
    ]
    for chunk in ollama.chat(model=CHAT_MODEL, messages=messages, stream=True):
        print(chunk["message"]["content"], end="", flush=True)
    print("\n\nSources:")
    for _, m, dist in hits:
        print(f"  - {m['source']} p.{m['page']}  (distance {dist:.3f})")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", help="search only one of: books, notes, question-papers")
    args = parser.parse_args()
    print("Ask a question (Ctrl+C to quit)")
    while True:
        q = input("\n> ").strip()
        if q:
            answer(q, args.category)