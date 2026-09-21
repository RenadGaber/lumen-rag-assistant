import ollama
from app.core.config import settings
from app.services.retrieval import retrieve


def generate_answer(question: str):
    context_chunks, sources = retrieve(question)
    context = "\n\n".join(context_chunks)

    prompt = f"""You are a helpful study assistant for Computer Science students.
Answer strictly based on the given context. Use clear bullet points when comparing concepts.
If the context is not enough, say the information is not in the documents.
Answer in English only.

Context:
{context}

Question: {question}

Answer:"""

    response = ollama.chat(
        model=settings.ollama_model,
        messages=[{"role": "user", "content": prompt}]
    )

    answer = response["message"]["content"]
    unique_sources = list(set(sources))

    return answer, unique_sources