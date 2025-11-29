from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class AIModelBase(BaseModel):
    nombre: str
    version: str
    parametros: Optional[Dict[str, Any]] = None
    descripcion: Optional[str] = None
    is_active: bool = True


class AIModelCreate(AIModelBase):
    pass


class AIModelUpdate(BaseModel):
    nombre: Optional[str] = None
    version: Optional[str] = None
    parametros: Optional[Dict[str, Any]] = None
    descripcion: Optional[str] = None
    is_active: Optional[bool] = None


class AIModelResponse(AIModelBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
