from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.db.session import get_db
from app.db.crud import AssignmentCRUD, SpaceCRUD, ResourceCRUD
from app.schemas.assignment import (
    AssignmentCreate, AssignmentUpdate, AssignmentResponse,
    OptimizationRequest, OptimizationResult
)
from app.api.v1.auth import get_current_active_user, require_role
from app.services.optimizer import optimizer
from app.services.ai_gemini import optimize_space_allocation

router = APIRouter(prefix="/assignments", tags=["Assignments"])


@router.get("", response_model=List[AssignmentResponse], summary="Get all assignments")
async def get_assignments(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum records to return"),
    active_only: bool = Query(False, description="Return only active assignments"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Retrieve all assignments with pagination.
    
    - **skip**: Number of records to skip (default: 0)
    - **limit**: Maximum number of records to return (default: 100, max: 1000)
    - **active_only**: Filter only active assignments
    """
    if active_only:
        assignments = await AssignmentCRUD.get_active(db)
    else:
        assignments = await AssignmentCRUD.get_all(db, skip=skip, limit=limit)
    return assignments


@router.get("/{assignment_id}", response_model=AssignmentResponse, summary="Get assignment by ID")
async def get_assignment(
    assignment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Retrieve a specific assignment by ID.
    
    - **assignment_id**: Unique assignment identifier
    """
    assignment = await AssignmentCRUD.get_by_id(db, assignment_id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment with id {assignment_id} not found"
        )
    return assignment


@router.post("", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED, summary="Create new assignment")
async def create_assignment(
    assignment_data: AssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["admin", "standard"]))
):
    """
    Create a new assignment.
    
    - **space_id**: ID of the space to assign
    - **resource_id**: ID of the resource to assign
    - **fecha**: Assignment start date/time
    - **fecha_fin**: Assignment end date/time (optional)
    - **estado**: Status (default: activo)
    - **notas**: Additional notes (optional)
    """
    space = await SpaceCRUD.get_by_id(db, assignment_data.space_id)
    if not space:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Space with id {assignment_data.space_id} not found"
        )
    
    resource = await ResourceCRUD.get_by_id(db, assignment_data.resource_id)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Resource with id {assignment_data.resource_id} not found"
        )
    
    assignment = await AssignmentCRUD.create(db, **assignment_data.model_dump())
    return assignment


@router.put("/{assignment_id}", response_model=AssignmentResponse, summary="Update assignment")
async def update_assignment(
    assignment_id: int,
    assignment_data: AssignmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["admin", "standard"]))
):
    """
    Update an existing assignment.
    
    - **assignment_id**: Assignment ID to update
    """
    existing = await AssignmentCRUD.get_by_id(db, assignment_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment with id {assignment_id} not found"
        )
    
    update_data = assignment_data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No data provided for update"
        )
    
    if "space_id" in update_data:
        space = await SpaceCRUD.get_by_id(db, update_data["space_id"])
        if not space:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Space with id {update_data['space_id']} not found"
            )
    
    if "resource_id" in update_data:
        resource = await ResourceCRUD.get_by_id(db, update_data["resource_id"])
        if not resource:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Resource with id {update_data['resource_id']} not found"
            )
    
    updated = await AssignmentCRUD.update(db, assignment_id, **update_data)
    return updated


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete assignment")
async def delete_assignment(
    assignment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    """
    Delete an assignment.
    
    Requires admin role.
    
    - **assignment_id**: Assignment ID to delete
    """
    existing = await AssignmentCRUD.get_by_id(db, assignment_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment with id {assignment_id} not found"
        )
    
    await AssignmentCRUD.delete(db, assignment_id)
    return None


@router.post("/optimize", response_model=OptimizationResult, summary="Optimize space-resource assignments")
async def optimize_assignments(
    request: OptimizationRequest,
    use_ai: bool = Query(False, description="Use AI (Gemini) for optimization"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    """
    Run optimization algorithm to suggest optimal space-resource assignments.
    
    Requires admin role.
    
    - **space_ids**: List of space IDs to consider (optional, all if not provided)
    - **resource_ids**: List of resource IDs to consider (optional, all if not provided)
    - **fecha_inicio**: Start date for optimization period (optional)
    - **fecha_fin**: End date for optimization period (optional)
    - **criterios**: Custom optimization criteria weights (optional)
    - **use_ai**: Use AI (Gemini) for enhanced optimization (default: false)
    """
    if request.space_ids:
        spaces = []
        for sid in request.space_ids:
            space = await SpaceCRUD.get_by_id(db, sid)
            if space:
                spaces.append({
                    "id": space.id,
                    "nombre": space.nombre,
                    "tipo": space.tipo,
                    "capacidad": space.capacidad,
                    "ubicacion": space.ubicacion,
                    "caracteristicas": space.caracteristicas or {},
                    "estado": space.estado
                })
    else:
        all_spaces = await SpaceCRUD.get_all(db)
        spaces = [
            {
                "id": s.id,
                "nombre": s.nombre,
                "tipo": s.tipo,
                "capacidad": s.capacidad,
                "ubicacion": s.ubicacion,
                "caracteristicas": s.caracteristicas or {},
                "estado": s.estado
            } for s in all_spaces
        ]
    
    if request.resource_ids:
        resources = []
        for rid in request.resource_ids:
            resource = await ResourceCRUD.get_by_id(db, rid)
            if resource:
                resources.append({
                    "id": resource.id,
                    "nombre": resource.nombre,
                    "tipo": resource.tipo,
                    "estado": resource.estado,
                    "categoria_id": resource.categoria_id,
                    "caracteristicas": resource.caracteristicas or {}
                })
    else:
        all_resources = await ResourceCRUD.get_all(db)
        resources = [
            {
                "id": r.id,
                "nombre": r.nombre,
                "tipo": r.tipo,
                "estado": r.estado,
                "categoria_id": r.categoria_id,
                "caracteristicas": r.caracteristicas or {}
            } for r in all_resources
        ]
    
    all_assignments = await AssignmentCRUD.get_all(db)
    existing_assignments = [
        {
            "id": a.id,
            "space_id": a.space_id,
            "resource_id": a.resource_id,
            "estado": a.estado
        } for a in all_assignments
    ]
    
    if use_ai:
        data = {
            "spaces": spaces,
            "resources": resources,
            "existing_assignments": existing_assignments,
            "criteria": request.criterios
        }
        result = await optimize_space_allocation(data)
    else:
        result = optimizer.optimize_assignments(
            spaces=spaces,
            resources=resources,
            existing_assignments=existing_assignments,
            criteria=request.criterios
        )
    
    return OptimizationResult(**result)
