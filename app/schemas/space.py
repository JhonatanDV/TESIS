from pydantic import BaseModel
from typing import Optional, Dict, Any, List, Union
from datetime import datetime


class SpaceBase(BaseModel):
    nombre: str
    tipo: str
    capacidad: int
    ubicacion: Optional[str] = None
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    caracteristicas: Optional[Union[Dict[str, Any], List[str]]] = None
    estado: str = "disponible"


class SpaceCreate(SpaceBase):
    pass


class SpaceUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[str] = None
    capacidad: Optional[int] = None
    ubicacion: Optional[str] = None
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    caracteristicas: Optional[Union[Dict[str, Any], List[str]]] = None
    estado: Optional[str] = None


class SpaceResponse(SpaceBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SpaceAvailable(BaseModel):
    id: int
    nombre: str
    tipo: str
    capacidad: int
    ubicacion: Optional[str] = None
    disponible: bool = True

    class Config:
        from_attributes = True
