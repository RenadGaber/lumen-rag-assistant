import chromadb
from sentence_transformers import SentenceTransformer
from app.core.config import settings

_chroma_client = chromadb.PersistentClient(path=settings.vector_store_path)
_collection = _chroma_client.get_collection(name=settings.collection_name)
_embedder = SentenceTransformer(settings.embedding_model)


def retrieve(query: str, n_results: int = 3):
    query_embedding = _embedder.encode([query]).tolist()
    results = _collection.query(
        query_embeddings=query_embedding,
        n_results=n_results
    )

    documents = results["documents"][0]
    metadatas = results.get("metadatas", [[{}] * len(documents)])[0]
    sources = [m.get("source", "unknown") for m in metadatas]

    return documents, sources