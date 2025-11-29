from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class AssignmentBase(BaseModel):
    space_id: int
    resource_id: int
    fecha: datetime
    fecha_fin: Optional[datetime] = None
    estado: str = "activo"
    notas: Optional[str] = None


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    space_id: Optional[int] = None
    resource_id: Optional[int] = None
    fecha: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    estado: Optional[str] = None
    notas: Optional[str] = None


class AssignmentResponse(AssignmentBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OptimizationRequest(BaseModel):
    space_ids: Optional[List[int]] = None
    resource_ids: Optional[List[int]] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    criterios: Optional[Dict[str, Any]] = None


class OptimizationResult(BaseModel):
    recomendaciones: List[Dict[str, Any]]
    score_optimizacion: float
    mensaje: str
    asignaciones_sugeridas: Optional[List[Dict[str, Any]]] = None
