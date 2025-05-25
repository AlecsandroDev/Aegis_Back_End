from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    country: str

class UserCreate(UserBase):
    password: str
    agree_to_terms: bool

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(UserBase):
    id: int
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    # Email geralmente não é alterado ou requer um processo de verificação especial.
    # Se permitir alteração de email, adicione: email: Optional[EmailStr] = None
    country: Optional[str] = None
    
    # Campos adicionais que você tem no ProfileEdit.tsx
    # Certifique-se de que seu models.User no backend também tenha colunas para estes se quiser salvá-los no DB
    role: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None # Pode ser uma URL para a imagem do avatar
    skills: Optional[list[str]] = None # Lista de strings para as competências

    class Config:
        from_attributes = True # ou orm_mode = True para Pydantic v1