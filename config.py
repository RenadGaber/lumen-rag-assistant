from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    vector_store_path: str = "./data/vector_store"
    collection_name: str = "lumen_docs"
    embedding_model: str = "paraphrase-multilingual-MiniLM-L12-v2"
    ollama_model: str = "qwen2.5:3b"

    class Config:
        env_file = ".env"

settings = Settings()