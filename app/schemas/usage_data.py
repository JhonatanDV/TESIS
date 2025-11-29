from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class UsageDataBase(BaseModel):
    space_id: Optional[int] = None
    resource_id: Optional[int] = None
    fecha: datetime
    uso: float = 0.0
    metricas: Optional[Dict[str, Any]] = None


class UsageDataCreate(UsageDataBase):
    pass


class UsageDataResponse(UsageDataBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
