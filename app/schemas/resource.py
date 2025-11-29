from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class ResourceBase(BaseModel):
    nombre: str
    tipo: str
    estado: str = "disponible"
    categoria_id: Optional[int] = None
    caracteristicas: Optional[Dict[str, Any]] = None


class ResourceCreate(ResourceBase):
    pass


class ResourceUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[str] = None
    estado: Optional[str] = None
    categoria_id: Optional[int] = None
    caracteristicas: Optional[Dict[str, Any]] = None


class ResourceResponse(ResourceBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
