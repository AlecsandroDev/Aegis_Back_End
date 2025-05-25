# auth_utils.py (VERSÃO CONSOLIDADA E CORRIGIDA)

from datetime import datetime, timedelta, timezone # datetime.now(timezone.utc) é geralmente preferível a utcnow()
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext # Importado de auth.py
from sqlalchemy.orm import Session

# Importe seus módulos (ajuste os caminhos se necessário, ex: from . import database, models)
import database
import models
import schemas # Embora não usado diretamente neste arquivo, pode ser útil para TokenData no futuro

# --- Configurações do JWT e Senha (PEGAS DO SEU ARQUIVO auth.py ORIGINAL) ---
SECRET_KEY = "super-secret-dev-key"  # Esta é a chave que seu sistema já estava usando
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # Tempo de expiração do seu auth.py

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Funções de Autenticação (PEGAS DO SEU auth.py ORIGINAL E AJUSTADAS/COMBINADAS) ---

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        # Se um expires_delta for fornecido, use-o (datetime.now(timezone.utc) é mais moderno)
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Caso contrário, use o padrão (datetime.now(timezone.utc) é mais moderno)
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Garante que o campo 'exp' seja um timestamp (se já não for)
    # A conversão para timestamp não é estritamente necessária aqui se o 'expire' for um objeto datetime,
    # pois a biblioteca jose pode lidar com isso. Mas datetime.utcnow() no seu auth.py original
    # também retornava um objeto datetime. Vamos manter a consistência.
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- OAuth2 Scheme e Função para Obter Usuário Atual ---

# tokenUrl deve apontar para a sua rota de login completa
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(db: Session = Depends(database.get_db), token: str = Depends(oauth2_scheme)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if email is None:
            raise credentials_exception
        # Opcional: validar expiração aqui também, embora jwt.decode já faça isso.
        # exp = payload.get("exp")
        # if exp is None or datetime.fromtimestamp(exp, timezone.utc) < datetime.now(timezone.utc):
        #     raise HTTPException(
        #         status_code=status.HTTP_401_UNAUTHORIZED,
        #         detail="Token expirado",
        #         headers={"WWW-Authenticate": "Bearer"},
        #     )
    except JWTError: # Captura qualquer erro da biblioteca JOSE (token malformado, assinatura inválida, expirado)
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        # Usuário não encontrado no banco, mesmo que o token seja tecnicamente válido
        raise credentials_exception
    return user

# Função decode_access_token (do seu auth.py) - pode ser útil para outros propósitos,
# mas get_current_user já faz a decodificação e validação para proteger rotas.
def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None