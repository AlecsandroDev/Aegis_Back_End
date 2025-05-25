from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import database, models
from routes import auth

app = FastAPI()

# CORS para frontend local
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
      "http://localhost",
      "http://localhost:8080",
      "http://localhost:8081",
    ],  # Altere para URL do front em produção
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cria tabelas no banco
models.Base.metadata.create_all(bind=database.engine)

# Rotas de autenticação
app.include_router(auth.router)
