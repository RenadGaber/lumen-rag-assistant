from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.query import router as query_router

app = FastAPI(title="Lumen RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # لسه في مرحلة التطوير، لاحقًا تحدده بدقة أكتر
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(query_router)