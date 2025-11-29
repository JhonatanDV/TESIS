from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.crud import NotificationCRUD, NotificationSettingsCRUD
from app.db.models import Notification

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NotificationService:
    
    @staticmethod
    async def send_notification(
        db: AsyncSession,
        user_id: int,
        titulo: str,
        mensaje: str,
        tipo: str = "info"
    ) -> Optional[Notification]:
        settings = await NotificationSettingsCRUD.get_by_user(db, user_id)
        
        if settings:
            if tipo == "assignment" and not settings.assignment_alerts:
                logger.info(f"Assignment alerts disabled for user {user_id}")
                return None
            if tipo == "usage" and not settings.usage_alerts:
                logger.info(f"Usage alerts disabled for user {user_id}")
                return None
            if tipo == "optimization" and not settings.optimization_alerts:
                logger.info(f"Optimization alerts disabled for user {user_id}")
                return None
        
        notification = await NotificationCRUD.create(
            db,
            user_id=user_id,
            titulo=titulo,
            mensaje=mensaje,
            tipo=tipo
        )
        
        logger.info(f"Notification sent to user {user_id}: {titulo}")
        return notification

    @staticmethod
    async def send_assignment_notification(
        db: AsyncSession,
        user_id: int,
        assignment_data: Dict[str, Any]
    ) -> Optional[Notification]:
        return await NotificationService.send_notification(
            db,
            user_id=user_id,
            titulo="Nueva Asignación",
            mensaje=f"Se ha creado una nueva asignación: Espacio {assignment_data.get('space_id')} - Recurso {assignment_data.get('resource_id')}",
            tipo="assignment"
        )

    @staticmethod
    async def send_optimization_notification(
        db: AsyncSession,
        user_id: int,
        optimization_result: Dict[str, Any]
    ) -> Optional[Notification]:
        score = optimization_result.get("score_optimizacion", 0)
        count = len(optimization_result.get("asignaciones_sugeridas", []))
        
        return await NotificationService.send_notification(
            db,
            user_id=user_id,
            titulo="Resultado de Optimización",
            mensaje=f"Se han encontrado {count} asignaciones sugeridas con un score de {score:.2%}",
            tipo="optimization"
        )

    @staticmethod
    async def send_usage_alert(
        db: AsyncSession,
        user_id: int,
        space_id: int,
        usage_percentage: float
    ) -> Optional[Notification]:
        if usage_percentage > 90:
            nivel = "CRÍTICO"
        elif usage_percentage > 75:
            nivel = "ALTO"
        else:
            nivel = "MODERADO"
        
        return await NotificationService.send_notification(
            db,
            user_id=user_id,
            titulo=f"Alerta de Uso {nivel}",
            mensaje=f"El espacio {space_id} tiene un uso del {usage_percentage:.1f}%",
            tipo="usage"
        )

    @staticmethod
    async def get_user_notifications(
        db: AsyncSession,
        user_id: int,
        skip: int = 0,
        limit: int = 50,
        unread_only: bool = False
    ) -> List[Notification]:
        notifications = await NotificationCRUD.get_by_user(db, user_id, skip, limit)
        
        if unread_only:
            notifications = [n for n in notifications if not n.leida]
        
        return notifications

    @staticmethod
    async def mark_notification_read(
        db: AsyncSession,
        notification_id: int
    ) -> bool:
        return await NotificationCRUD.mark_as_read(db, notification_id)


notification_service = NotificationService()
