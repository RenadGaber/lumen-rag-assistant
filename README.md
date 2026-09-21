# Lumen

**Lumen** is a RAG-powered (Retrieval-Augmented Generation) study assistant for Computer Science university students. Upload your own lecture notes and past exams, and ask questions in plain language — Lumen answers strictly from your material and always tells you which document the answer came from.

> Track: **Core Track** (text-only RAG pipeline)

---

## Overview

Traditional AI chatbots answer from general internet knowledge, which is often wrong or irrelevant for a specific course. Lumen instead:

1. Reads your own PDFs (lecture slides, past exams)
2. Splits them into searchable chunks and stores them as vector embeddings
3. When you ask a question, retrieves the most relevant chunks
4. Sends those chunks + your question to a local, free LLM (via Ollama)
5. Returns an answer **grounded in your documents**, with the source file(s) listed

---

## Architecture

```
┌─────────────┐      POST /query        ┌──────────────────┐
│   Frontend   │ ───────────────────────▶│  FastAPI Backend  │
│ (HTML/CSS/JS)│                          │                   │
│              │◀─────────────────────── │  ┌─────────────┐  │
└─────────────┘   { answer, sources }     │  │ Retrieval   │  │
                                           │  │ (ChromaDB + │  │
                                           │  │ embeddings) │  │
                                           │  └──────┬──────┘  │
                                           │         │         │
                                           │  ┌──────▼──────┐  │
                                           │  │ Generation  │  │
                                           │  │  (Ollama)   │  │
                                           │  └─────────────┘  │
                                           └──────────────────┘
                                                    ▲
                                                    │ built by
                                           ┌──────────────────┐
                                           │ notebooks/        │
                                           │ RagLumen.ipynb     │
                                           │ (PDF → chunks →    │
                                           │  embeddings →      │
                                           │  vector store)     │
                                           └──────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| PDF extraction | `pdfplumber` |
| Chunking & embeddings | `sentence-transformers` (`paraphrase-multilingual-MiniLM-L12-v2`) |
| Vector store | `ChromaDB` (persistent, local) |
| LLM (generation) | `Ollama` running `qwen2.5:3b` (free, local, open-source) |
| Backend API | `FastAPI` + `uvicorn` |
| Testing | `pytest` + `httpx` |
| Frontend | Static HTML / CSS / vanilla JS |

---

## Project Structure

```
lumen/
├── notebooks/
│   └── RagLumen.ipynb          # Full RAG pipeline: load → chunk → embed → store → evaluate
├── Backend/
│   ├── app/
│   │   ├── main.py             # FastAPI app entrypoint, CORS setup
│   │   ├── core/
│   │   │   └── config.py       # Settings loaded from .env
│   │   ├── api/routes/
│   │   │   └── query.py        # GET /health, POST /query
│   │   ├── schemas/
│   │   │   └── query.py        # Request/response models
│   │   ├── services/
│   │   │   ├── retrieval.py    # Loads vector store, retrieves relevant chunks
│   │   │   └── generation.py   # Calls Ollama, builds the prompt
│   │   └── utils/
│   │       └── logging_config.py
│   ├── data/
│   │   └── vector_store/       # Chroma persistent DB (NOT in repo — see setup below)
│   ├── tests/
│   │   └── test_query.py
│   ├── requirements.txt
│   ├── .env.example
│   └── .env                    # NOT in repo (secrets/local config)
├── index.html                  # Frontend landing + chat UI
├── styles.css
├── main.js
└── README.md
```

---

## Dataset

The knowledge base used for this project consists of Computer Science university lecture PDFs, covering topics such as:
- Data Structures: Arrays, Linked Lists, Stacks, Queues, Trees, Hashing
- Probability & Statistics: Normal Distribution

All source PDFs were verified to contain extractable text (no scanned/image-only pages).

---

## Setup & Running Locally

### Prerequisites
- Python 3.10+
- [Ollama](https://ollama.com/download) installed and running
- Git

### 1. Clone the repo
```bash
git clone <repo-url>
cd lumen
```

### 2. Set up the backend
```bash
cd Backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

### 3. Pull the LLM model
```bash
ollama pull qwen2.5:3b
ollama serve
```
(keep this terminal running)

### 4. Rebuild the vector store
The `data/vector_store/` folder is **not included** in this repository (per assignment guidelines — large files are excluded via `.gitignore`). To rebuild it:

1. Open `notebooks/RagLumen.ipynb` in Jupyter or Google Colab
2. Place your PDF documents in a `data/` folder
3. Run all cells (`Kernel → Restart & Run All`) — this generates `data/vector_store/`
4. Copy the generated `vector_store/` folder into `Backend/data/vector_store/`

### 5. Configure environment variables
Copy `.env.example` to `.env` inside `Backend/` and adjust if needed:
```bash
copy .env.example .env
```

### 6. Run the backend
```bash
uvicorn app.main:app --reload
```
The API will be available at `http://127.0.0.1:8000`.

### 7. Open the frontend
Open `index.html` (or `lumen-landing-full.html`) directly in your browser. It connects to the backend automatically at `http://127.0.0.1:8000`.

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `VECTOR_STORE_PATH` | Path to the persistent Chroma database | `./data/vector_store` |
| `COLLECTION_NAME` | Name of the Chroma collection | `lumen_docs` |
| `EMBEDDING_MODEL` | Sentence-transformers model (must match the one used in the notebook) | `paraphrase-multilingual-MiniLM-L12-v2` |
| `OLLAMA_MODEL` | Ollama model used for answer generation | `qwen2.5:3b` |

---

## API Documentation

Interactive docs are auto-generated by FastAPI at:
```
http://127.0.0.1:8000/docs
```

### `GET /health`
Health check.

```bash
curl http://127.0.0.1:8000/health
```
```json
{"status": "ok"}
```

### `POST /query`
Ask a question grounded in the indexed documents.

```bash
curl -X POST http://127.0.0.1:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the difference between a stack and a queue?"}'
```

```json
{
  "answer": "A stack follows LIFO... A queue follows FIFO...",
  "sources": ["Lec 3 - Stacks.pdf", "Lec 4 - Queues.pdf"]
}
```

Invalid input (missing `question`) returns `422 Unprocessable Entity`.

---

## Evaluation Results

10 questions were tested against the pipeline (full detail in `notebooks/RagLumen.ipynb`, section 2.6):

| # | Question | Source | Correct? |
|---|---|---|---|
| 1 | Difference between Stack and Queue | Lec 3, Lec 4 | ✅ |
| 2 | Difference between Array and Linked List | Lec 2, Lec 5 | ✅ |
| 3 | How hashing works | Lec 7 | ✅ |
| 4 | Definition of Normal Distribution | Probability lecture | ✅ |
| 5 | Solved example: Normal Distribution probability | Probability lecture | ✅ |
| 6 | List all data structure types covered (broad query) | multiple | ⚠️ Partial — limited by `n_results` |
| 7 | Best case time complexity of Binary Search | Lec | ❌ Model answered O(log n) instead of O(1) |
| 8 | Binary Search code implementation | Lec | ✅ |

### Failure cases & mitigations
- **Arabic technical terms got mistranslated/inverted** by the small LLM → mitigated by constraining answers to English (matching the source language), which eliminated the errors.
- **Repetitive/looping output** initially occurred with raw-text prompting → fixed by switching to the chat `messages` format and adding `repetition_penalty`.
- **Broad/overly general questions** ("list everything in the course") returned incomplete answers, since retrieval is limited to the top-k (3) most relevant chunks by design — this is a known trade-off of similarity-based retrieval, not a bug.
- **Analytical reasoning errors** (e.g., Big-O best-case classification) occurred where the answer requires deduction beyond what's explicitly stated in the source text — a limitation of the small local LLM (`qwen2.5:3b`) rather than the retrieval step, which correctly surfaced the relevant chunk.

---

## Screenshots

_Add screenshots of the running application here before submission._

---

## Notes

- The backend loads the embedding model and vector store **once at startup**, not per request.
- CORS is currently open (`*`) for local development; restrict `allow_origins` before any public deployment.
- Sign-in and document upload are UI placeholders reserved for future work — the core deliverable (question → retrieval → LLM → sourced answer) is fully functional end-to-end.
