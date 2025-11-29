from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.db.crud import NotificationCRUD, NotificationSettingsCRUD
from app.schemas.notification import (
    NotificationCreate, NotificationResponse,
    NotificationSettingsBase, NotificationSettingsUpdate, NotificationSettingsResponse
)
from app.api.v1.auth import get_current_active_user, require_role

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationResponse], summary="Get user notifications")
async def get_notifications(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum records to return"),
    unread_only: bool = Query(False, description="Return only unread notifications"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Get notifications for the current user.
    
    - **skip**: Number of records to skip (default: 0)
    - **limit**: Maximum number of records to return (default: 50, max: 100)
    - **unread_only**: Filter only unread notifications
    """
    notifications = await NotificationCRUD.get_by_user(db, current_user.id, skip, limit)
    
    if unread_only:
        notifications = [n for n in notifications if not n.leida]
    
    return notifications


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED, summary="Create notification")
async def create_notification(
    notification_data: NotificationCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    """
    Create a new notification.
    
    Requires admin role.
    
    - **user_id**: Target user ID
    - **titulo**: Notification title
    - **mensaje**: Notification message
    - **tipo**: Notification type (info, warning, error, success)
    """
    notification = await NotificationCRUD.create(db, **notification_data.model_dump())
    return notification


@router.put("/{notification_id}/read", summary="Mark notification as read")
async def mark_as_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Mark a notification as read.
    
    - **notification_id**: Notification ID to mark as read
    """
    success = await NotificationCRUD.mark_as_read(db, notification_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification with id {notification_id} not found"
        )
    return {"message": "Notification marked as read"}


@router.get("/settings", response_model=NotificationSettingsResponse, summary="Get notification settings")
async def get_notification_settings(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Get notification settings for the current user.
    
    Returns the user's notification preferences.
    """
    settings = await NotificationSettingsCRUD.get_by_user(db, current_user.id)
    
    if not settings:
        settings = await NotificationSettingsCRUD.create_or_update(
            db,
            current_user.id,
            email_enabled=True,
            push_enabled=True,
            assignment_alerts=True,
            usage_alerts=True,
            optimization_alerts=True
        )
    
    return settings


@router.put("/settings", response_model=NotificationSettingsResponse, summary="Update notification settings")
async def update_notification_settings(
    settings_data: NotificationSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Update notification settings for the current user.
    
    - **email_enabled**: Enable/disable email notifications
    - **push_enabled**: Enable/disable push notifications
    - **assignment_alerts**: Enable/disable assignment alerts
    - **usage_alerts**: Enable/disable usage alerts
    - **optimization_alerts**: Enable/disable optimization alerts
    """
    update_data = settings_data.model_dump(exclude_unset=True)
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No data provided for update"
        )
    
    settings = await NotificationSettingsCRUD.create_or_update(
        db,
        current_user.id,
        **update_data
    )
    
    return settings
