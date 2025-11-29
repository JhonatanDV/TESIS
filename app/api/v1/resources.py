from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.db.crud import ResourceCRUD, CategoryCRUD
from app.schemas.resource import ResourceCreate, ResourceUpdate, ResourceResponse
from app.schemas.category import CategoryResponse
from app.api.v1.auth import get_current_active_user, require_role

router = APIRouter(prefix="/resources", tags=["Resources"])


@router.get("", response_model=List[ResourceResponse], summary="Get all resources")
async def get_resources(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum records to return"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Retrieve all resources with pagination.
    
    - **skip**: Number of records to skip (default: 0)
    - **limit**: Maximum number of records to return (default: 100, max: 1000)
    """
    resources = await ResourceCRUD.get_all(db, skip=skip, limit=limit)
    return resources


@router.get("/categories", response_model=List[CategoryResponse], summary="Get all resource categories")
async def get_categories(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Retrieve all resource categories.
    
    Categories are used to organize and classify resources.
    """
    categories = await CategoryCRUD.get_all(db)
    return categories


@router.get("/{resource_id}", response_model=ResourceResponse, summary="Get resource by ID")
async def get_resource(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Retrieve a specific resource by ID.
    
    - **resource_id**: Unique resource identifier
    """
    resource = await ResourceCRUD.get_by_id(db, resource_id)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with id {resource_id} not found"
        )
    return resource


@router.post("", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED, summary="Create new resource")
async def create_resource(
    resource_data: ResourceCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    """
    Create a new resource.
    
    Requires admin role.
    
    - **nombre**: Resource name
    - **tipo**: Resource type
    - **estado**: Status (default: disponible)
    - **categoria_id**: Category ID (optional)
    - **caracteristicas**: Additional features as JSON (optional)
    """
    if resource_data.categoria_id:
        category = await CategoryCRUD.get_by_id(db, resource_data.categoria_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with id {resource_data.categoria_id} not found"
            )
    
    resource = await ResourceCRUD.create(db, **resource_data.model_dump())
    return resource


@router.put("/{resource_id}", response_model=ResourceResponse, summary="Update resource")
async def update_resource(
    resource_id: int,
    resource_data: ResourceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    """
    Update an existing resource.
    
    Requires admin role.
    
    - **resource_id**: Resource ID to update
    """
    existing = await ResourceCRUD.get_by_id(db, resource_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with id {resource_id} not found"
        )
    
    update_data = resource_data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No data provided for update"
        )
    
    if "categoria_id" in update_data and update_data["categoria_id"]:
        category = await CategoryCRUD.get_by_id(db, update_data["categoria_id"])
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with id {update_data['categoria_id']} not found"
            )
    
    updated = await ResourceCRUD.update(db, resource_id, **update_data)
    return updated


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete resource")
async def delete_resource(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    """
    Delete a resource.
    
    Requires admin role.
    
    - **resource_id**: Resource ID to delete
    """
    existing = await ResourceCRUD.get_by_id(db, resource_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with id {resource_id} not found"
        )
    
    await ResourceCRUD.delete(db, resource_id)
    return None
