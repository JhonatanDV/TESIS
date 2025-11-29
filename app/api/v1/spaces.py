from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.session import get_db
from app.db.crud import SpaceCRUD
from app.schemas.space import SpaceCreate, SpaceUpdate, SpaceResponse, SpaceAvailable
from app.api.v1.auth import get_current_active_user, require_role

router = APIRouter(prefix="/spaces", tags=["Spaces"])


@router.get("", response_model=List[SpaceResponse], summary="Get all spaces")
async def get_spaces(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum records to return"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Retrieve all spaces with pagination.
    
    - **skip**: Number of records to skip (default: 0)
    - **limit**: Maximum number of records to return (default: 100, max: 1000)
    """
    spaces = await SpaceCRUD.get_all(db, skip=skip, limit=limit)
    return spaces


@router.get("/available", response_model=List[SpaceAvailable], summary="Get available spaces")
async def get_available_spaces(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Retrieve all available spaces (estado='disponible').
    
    Returns spaces that are currently available for assignments.
    """
    spaces = await SpaceCRUD.get_available(db)
    return [
        SpaceAvailable(
            id=s.id,
            nombre=s.nombre,
            tipo=s.tipo,
            capacidad=s.capacidad,
            ubicacion=s.ubicacion,
            disponible=True
        ) for s in spaces
    ]


@router.get("/{space_id}", response_model=SpaceResponse, summary="Get space by ID")
async def get_space(
    space_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Retrieve a specific space by ID.
    
    - **space_id**: Unique space identifier
    """
    space = await SpaceCRUD.get_by_id(db, space_id)
    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Space with id {space_id} not found"
        )
    return space


@router.post("", response_model=SpaceResponse, status_code=status.HTTP_201_CREATED, summary="Create new space")
async def create_space(
    space_data: SpaceCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    """
    Create a new space.
    
    Requires admin role.
    
    - **nombre**: Space name
    - **tipo**: Space type (oficina, sala de reuniones, laboratorio, etc.)
    - **capacidad**: Maximum capacity
    - **ubicacion**: Physical location (optional)
    - **caracteristicas**: Additional features as JSON (optional)
    - **estado**: Status (default: disponible)
    """
    space = await SpaceCRUD.create(db, **space_data.model_dump())
    return space


@router.put("/{space_id}", response_model=SpaceResponse, summary="Update space")
async def update_space(
    space_id: int,
    space_data: SpaceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    """
    Update an existing space.
    
    Requires admin role.
    
    - **space_id**: Space ID to update
    """
    existing = await SpaceCRUD.get_by_id(db, space_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Space with id {space_id} not found"
        )
    
    update_data = space_data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No data provided for update"
        )
    
    updated = await SpaceCRUD.update(db, space_id, **update_data)
    return updated


@router.delete("/{space_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete space")
async def delete_space(
    space_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    """
    Delete a space.
    
    Requires admin role.
    
    - **space_id**: Space ID to delete
    """
    existing = await SpaceCRUD.get_by_id(db, space_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Space with id {space_id} not found"
        )
    
    await SpaceCRUD.delete(db, space_id)
    return None
