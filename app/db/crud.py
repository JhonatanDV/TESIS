from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, and_, or_
from sqlalchemy.orm import selectinload
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.db.models import (
    User, Space, Resource, Assignment, Category, 
    AIModel, UsageData, Notification, NotificationSettings
)
from app.core.security import get_password_hash


class UserCRUD:
    @staticmethod
    async def create(db: AsyncSession, username: str, password: str, email: str = None, rol: str = "standard") -> User:
        hashed_password = get_password_hash(password)
        user = User(username=username, email=email, password_hash=hashed_password, rol=rol)
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user

    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_username(db: AsyncSession, username: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[User]:
        result = await db.execute(select(User).offset(skip).limit(limit))
        return result.scalars().all()

    @staticmethod
    async def update(db: AsyncSession, user_id: int, **kwargs) -> Optional[User]:
        await db.execute(update(User).where(User.id == user_id).values(**kwargs))
        return await UserCRUD.get_by_id(db, user_id)

    @staticmethod
    async def delete(db: AsyncSession, user_id: int) -> bool:
        result = await db.execute(delete(User).where(User.id == user_id))
        return result.rowcount > 0


class SpaceCRUD:
    @staticmethod
    async def create(db: AsyncSession, **kwargs) -> Space:
        space = Space(**kwargs)
        db.add(space)
        await db.flush()
        await db.refresh(space)
        return space

    @staticmethod
    async def get_by_id(db: AsyncSession, space_id: int) -> Optional[Space]:
        result = await db.execute(select(Space).where(Space.id == space_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Space]:
        result = await db.execute(select(Space).offset(skip).limit(limit))
        return result.scalars().all()

    @staticmethod
    async def get_available(db: AsyncSession) -> List[Space]:
        result = await db.execute(select(Space).where(Space.estado == "disponible"))
        return result.scalars().all()

    @staticmethod
    async def update(db: AsyncSession, space_id: int, **kwargs) -> Optional[Space]:
        kwargs['updated_at'] = datetime.utcnow()
        await db.execute(update(Space).where(Space.id == space_id).values(**kwargs))
        return await SpaceCRUD.get_by_id(db, space_id)

    @staticmethod
    async def delete(db: AsyncSession, space_id: int) -> bool:
        result = await db.execute(delete(Space).where(Space.id == space_id))
        return result.rowcount > 0


class ResourceCRUD:
    @staticmethod
    async def create(db: AsyncSession, **kwargs) -> Resource:
        resource = Resource(**kwargs)
        db.add(resource)
        await db.flush()
        await db.refresh(resource)
        return resource

    @staticmethod
    async def get_by_id(db: AsyncSession, resource_id: int) -> Optional[Resource]:
        result = await db.execute(select(Resource).where(Resource.id == resource_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Resource]:
        result = await db.execute(select(Resource).offset(skip).limit(limit))
        return result.scalars().all()

    @staticmethod
    async def get_by_category(db: AsyncSession, categoria_id: int) -> List[Resource]:
        result = await db.execute(select(Resource).where(Resource.categoria_id == categoria_id))
        return result.scalars().all()

    @staticmethod
    async def update(db: AsyncSession, resource_id: int, **kwargs) -> Optional[Resource]:
        kwargs['updated_at'] = datetime.utcnow()
        await db.execute(update(Resource).where(Resource.id == resource_id).values(**kwargs))
        return await ResourceCRUD.get_by_id(db, resource_id)

    @staticmethod
    async def delete(db: AsyncSession, resource_id: int) -> bool:
        result = await db.execute(delete(Resource).where(Resource.id == resource_id))
        return result.rowcount > 0


class AssignmentCRUD:
    @staticmethod
    async def create(db: AsyncSession, **kwargs) -> Assignment:
        assignment = Assignment(**kwargs)
        db.add(assignment)
        await db.flush()
        await db.refresh(assignment)
        return assignment

    @staticmethod
    async def get_by_id(db: AsyncSession, assignment_id: int) -> Optional[Assignment]:
        result = await db.execute(select(Assignment).where(Assignment.id == assignment_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Assignment]:
        result = await db.execute(select(Assignment).offset(skip).limit(limit))
        return result.scalars().all()

    @staticmethod
    async def get_active(db: AsyncSession) -> List[Assignment]:
        result = await db.execute(select(Assignment).where(Assignment.estado == "activo"))
        return result.scalars().all()

    @staticmethod
    async def update(db: AsyncSession, assignment_id: int, **kwargs) -> Optional[Assignment]:
        kwargs['updated_at'] = datetime.utcnow()
        await db.execute(update(Assignment).where(Assignment.id == assignment_id).values(**kwargs))
        return await AssignmentCRUD.get_by_id(db, assignment_id)

    @staticmethod
    async def delete(db: AsyncSession, assignment_id: int) -> bool:
        result = await db.execute(delete(Assignment).where(Assignment.id == assignment_id))
        return result.rowcount > 0


class CategoryCRUD:
    @staticmethod
    async def create(db: AsyncSession, **kwargs) -> Category:
        category = Category(**kwargs)
        db.add(category)
        await db.flush()
        await db.refresh(category)
        return category

    @staticmethod
    async def get_by_id(db: AsyncSession, category_id: int) -> Optional[Category]:
        result = await db.execute(select(Category).where(Category.id == category_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all(db: AsyncSession) -> List[Category]:
        result = await db.execute(select(Category))
        return result.scalars().all()

    @staticmethod
    async def update(db: AsyncSession, category_id: int, **kwargs) -> Optional[Category]:
        await db.execute(update(Category).where(Category.id == category_id).values(**kwargs))
        return await CategoryCRUD.get_by_id(db, category_id)

    @staticmethod
    async def delete(db: AsyncSession, category_id: int) -> bool:
        result = await db.execute(delete(Category).where(Category.id == category_id))
        return result.rowcount > 0


class AIModelCRUD:
    @staticmethod
    async def create(db: AsyncSession, **kwargs) -> AIModel:
        ai_model = AIModel(**kwargs)
        db.add(ai_model)
        await db.flush()
        await db.refresh(ai_model)
        return ai_model

    @staticmethod
    async def get_by_id(db: AsyncSession, model_id: int) -> Optional[AIModel]:
        result = await db.execute(select(AIModel).where(AIModel.id == model_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_active(db: AsyncSession) -> List[AIModel]:
        result = await db.execute(select(AIModel).where(AIModel.is_active == True))
        return result.scalars().all()


class UsageDataCRUD:
    @staticmethod
    async def create(db: AsyncSession, **kwargs) -> UsageData:
        usage = UsageData(**kwargs)
        db.add(usage)
        await db.flush()
        await db.refresh(usage)
        return usage

    @staticmethod
    async def get_by_space(db: AsyncSession, space_id: int, limit: int = 100) -> List[UsageData]:
        result = await db.execute(
            select(UsageData)
            .where(UsageData.space_id == space_id)
            .order_by(UsageData.fecha.desc())
            .limit(limit)
        )
        return result.scalars().all()

    @staticmethod
    async def get_by_resource(db: AsyncSession, resource_id: int, limit: int = 100) -> List[UsageData]:
        result = await db.execute(
            select(UsageData)
            .where(UsageData.resource_id == resource_id)
            .order_by(UsageData.fecha.desc())
            .limit(limit)
        )
        return result.scalars().all()

    @staticmethod
    async def get_by_date_range(db: AsyncSession, start_date: datetime, end_date: datetime) -> List[UsageData]:
        result = await db.execute(
            select(UsageData)
            .where(and_(UsageData.fecha >= start_date, UsageData.fecha <= end_date))
            .order_by(UsageData.fecha.desc())
        )
        return result.scalars().all()


class NotificationCRUD:
    @staticmethod
    async def create(db: AsyncSession, **kwargs) -> Notification:
        notification = Notification(**kwargs)
        db.add(notification)
        await db.flush()
        await db.refresh(notification)
        return notification

    @staticmethod
    async def get_by_user(db: AsyncSession, user_id: int, skip: int = 0, limit: int = 50) -> List[Notification]:
        result = await db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    @staticmethod
    async def mark_as_read(db: AsyncSession, notification_id: int) -> bool:
        result = await db.execute(
            update(Notification)
            .where(Notification.id == notification_id)
            .values(leida=True)
        )
        return result.rowcount > 0


class NotificationSettingsCRUD:
    @staticmethod
    async def get_by_user(db: AsyncSession, user_id: int) -> Optional[NotificationSettings]:
        result = await db.execute(
            select(NotificationSettings).where(NotificationSettings.user_id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create_or_update(db: AsyncSession, user_id: int, **kwargs) -> NotificationSettings:
        existing = await NotificationSettingsCRUD.get_by_user(db, user_id)
        if existing:
            kwargs['updated_at'] = datetime.utcnow()
            await db.execute(
                update(NotificationSettings)
                .where(NotificationSettings.user_id == user_id)
                .values(**kwargs)
            )
            return await NotificationSettingsCRUD.get_by_user(db, user_id)
        else:
            settings = NotificationSettings(user_id=user_id, **kwargs)
            db.add(settings)
            await db.flush()
            await db.refresh(settings)
            return settings
