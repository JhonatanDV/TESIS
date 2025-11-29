from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationBase(BaseModel):
    titulo: str
    mensaje: str
    tipo: str = "info"


class NotificationCreate(NotificationBase):
    user_id: int


class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    leida: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationSettingsBase(BaseModel):
    email_enabled: bool = True
    push_enabled: bool = True
    assignment_alerts: bool = True
    usage_alerts: bool = True
    optimization_alerts: bool = True


class NotificationSettingsUpdate(BaseModel):
    email_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    assignment_alerts: Optional[bool] = None
    usage_alerts: Optional[bool] = None
    optimization_alerts: Optional[bool] = None


class NotificationSettingsResponse(NotificationSettingsBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
