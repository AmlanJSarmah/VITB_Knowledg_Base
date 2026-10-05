"""Terminal chatbot (for quick testing without the API)."""
import argparse
import ollama

import rag
from config import *

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", help="optional: search only one category")
    args = parser.parse_args()
    cats = [args.category] if args.category else None

    print("Ask a question (Ctrl+C to quit)")
    while True:
        q = input("\n> ").strip()
        if not q:
            continue
        hits = rag.retrieve(q, cats)
        for part in ollama.chat(model=CHAT_MODEL, messages=rag.build_messages(q, hits), stream=True):
            print(part["message"]["content"], end="", flush=True)
        print("\n\nSources:")
        for s in rag.sources_of(hits):
            print(f"  - [{s['category']}] {s['source']} p.{s['page']} (distance {s['distance']})")