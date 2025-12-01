from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime, timedelta

from app.db.session import get_db
from app.db.crud import SpaceCRUD, ResourceCRUD, AssignmentCRUD, UsageDataCRUD
from app.schemas.analytics import (
    UsageAnalytics, EfficiencyMetrics, PredictionResult,
    SimulationRequest, SimulationResult
)
from app.api.v1.auth import get_current_active_user, require_role
from app.services.ai_gemini import generate_predictions, analyze_usage_patterns, simulate_scenario

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/usage", response_model=UsageAnalytics, summary="Get usage analytics")
async def get_usage_analytics(
    start_date: Optional[datetime] = Query(None, description="Start date for analysis"),
    end_date: Optional[datetime] = Query(None, description="End date for analysis"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Get usage analytics for spaces and resources.
    
    - **start_date**: Analysis period start (default: 30 days ago)
    - **end_date**: Analysis period end (default: now)
    
    Returns aggregated usage statistics.
    """
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()
    
    all_spaces = await SpaceCRUD.get_all(db)
    all_resources = await ResourceCRUD.get_all(db)
    active_assignments = await AssignmentCRUD.get_active(db)
    
    spaces_in_use = set()
    resources_in_use = set()
    for assignment in active_assignments:
        spaces_in_use.add(assignment.space_id)
        resources_in_use.add(assignment.resource_id)
    
    usage_data = await UsageDataCRUD.get_by_date_range(db, start_date, end_date)
    
    avg_usage = 0.0
    if usage_data:
        avg_usage = sum(u.uso for u in usage_data) / len(usage_data)
    
    usage_by_type = {}
    for space in all_spaces:
        tipo = space.tipo
        if tipo not in usage_by_type:
            usage_by_type[tipo] = {"count": 0, "in_use": 0}
        usage_by_type[tipo]["count"] += 1
        if space.id in spaces_in_use:
            usage_by_type[tipo]["in_use"] += 1
    
    return UsageAnalytics(
        total_spaces=len(all_spaces),
        total_resources=len(all_resources),
        spaces_in_use=len(spaces_in_use),
        resources_in_use=len(resources_in_use),
        average_usage=round(avg_usage, 2),
        usage_by_type=usage_by_type,
        period_start=start_date,
        period_end=end_date
    )


@router.get("/efficiency", response_model=EfficiencyMetrics, summary="Get efficiency metrics")
async def get_efficiency_metrics(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Get efficiency metrics for space and resource utilization.
    
    Calculates overall efficiency scores and provides recommendations.
    """
    all_spaces = await SpaceCRUD.get_all(db)
    all_resources = await ResourceCRUD.get_all(db)
    active_assignments = await AssignmentCRUD.get_active(db)
    
    total_capacity = sum(s.capacidad for s in all_spaces)
    used_capacity = 0
    
    space_assignment_count = {}
    for assignment in active_assignments:
        sid = assignment.space_id
        space_assignment_count[sid] = space_assignment_count.get(sid, 0) + 1
    
    for space in all_spaces:
        assignments = space_assignment_count.get(space.id, 0)
        used_capacity += min(assignments, space.capacidad)
    
    space_efficiency = (used_capacity / total_capacity * 100) if total_capacity > 0 else 0
    
    available_resources = sum(1 for r in all_resources if r.estado == "disponible")
    assigned_resources = len(set(a.resource_id for a in active_assignments))
    resource_efficiency = (assigned_resources / len(all_resources) * 100) if all_resources else 0
    
    overall_efficiency = (space_efficiency + resource_efficiency) / 2
    
    optimization_score = min(1.0, overall_efficiency / 100 + 0.2)
    
    recommendations = []
    if space_efficiency < 50:
        recommendations.append("Considerar consolidar espacios subutilizados")
    if resource_efficiency < 50:
        recommendations.append("Revisar recursos sin asignar para posible reasignación")
    if overall_efficiency < 60:
        recommendations.append("Ejecutar optimización automática para mejorar eficiencia")
    if not recommendations:
        recommendations.append("El sistema está funcionando con buena eficiencia")
    
    metrics_by_space = []
    for space in all_spaces[:10]:
        assignments = space_assignment_count.get(space.id, 0)
        utilization = (assignments / space.capacidad * 100) if space.capacidad > 0 else 0
        metrics_by_space.append({
            "space_id": space.id,
            "nombre": space.nombre,
            "capacidad": space.capacidad,
            "asignaciones": assignments,
            "utilizacion": round(utilization, 1)
        })
    
    return EfficiencyMetrics(
        overall_efficiency=round(overall_efficiency, 2),
        space_efficiency=round(space_efficiency, 2),
        resource_efficiency=round(resource_efficiency, 2),
        optimization_score=round(optimization_score, 3),
        recommendations=recommendations,
        metrics_by_space=metrics_by_space
    )


@router.post("/predictions", response_model=PredictionResult, summary="Get usage predictions")
@router.get("/predictions", response_model=PredictionResult, summary="Get usage predictions")
async def get_predictions(
    days_ahead: int = Query(7, ge=1, le=90, description="Number of days to predict"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Get AI-powered usage predictions.
    
    Uses Gemini AI to analyze historical data and predict future usage patterns.
    
    - **days_ahead**: Number of days to predict (default: 7, max: 90)
    
    Accepts both GET and POST methods for compatibility.
    """
    start_date = datetime.utcnow() - timedelta(days=30)
    end_date = datetime.utcnow()
    
    all_spaces = await SpaceCRUD.get_all(db)
    all_resources = await ResourceCRUD.get_all(db)
    usage_data = await UsageDataCRUD.get_by_date_range(db, start_date, end_date)
    
    data = {
        "spaces": [
            {
                "id": s.id,
                "nombre": s.nombre,
                "tipo": s.tipo,
                "capacidad": s.capacidad
            } for s in all_spaces
        ],
        "resources": [
            {
                "id": r.id,
                "nombre": r.nombre,
                "tipo": r.tipo
            } for r in all_resources
        ],
        "historical_usage": [
            {
                "space_id": u.space_id,
                "resource_id": u.resource_id,
                "fecha": u.fecha.isoformat() if u.fecha else None,
                "uso": u.uso
            } for u in usage_data
        ],
        "prediction_days": days_ahead
    }
    
    result = await generate_predictions(data)
    
    return PredictionResult(
        predictions=result.get("predictions", []),
        confidence=result.get("confidence", 0.0),
        model_used=result.get("model_used", "gemini-2.0-flash"),
        generated_at=datetime.utcnow()
    )


@router.post("/simulate", response_model=SimulationResult, summary="Simulate scenario")
async def run_simulation(
    request: SimulationRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["admin", "estudiante"]))
):
    """
    Run a simulation to analyze the impact of proposed changes.
    
    Requires admin or estudiante role.
    
    - **scenario_name**: Name/description of the scenario
    - **parameters**: Scenario parameters (e.g., new spaces, resource changes)
    - **fecha_inicio**: Simulation start date (optional)
    - **fecha_fin**: Simulation end date (optional)
    """
    all_spaces = await SpaceCRUD.get_all(db)
    all_resources = await ResourceCRUD.get_all(db)
    all_assignments = await AssignmentCRUD.get_all(db)
    
    current_data = {
        "spaces": [
            {
                "id": s.id,
                "nombre": s.nombre,
                "tipo": s.tipo,
                "capacidad": s.capacidad,
                "estado": s.estado
            } for s in all_spaces
        ],
        "resources": [
            {
                "id": r.id,
                "nombre": r.nombre,
                "tipo": r.tipo,
                "estado": r.estado
            } for r in all_resources
        ],
        "assignments": [
            {
                "id": a.id,
                "space_id": a.space_id,
                "resource_id": a.resource_id,
                "estado": a.estado
            } for a in all_assignments
        ]
    }
    
    scenario = {
        "scenario_name": request.scenario_name,
        "parameters": request.parameters,
        "fecha_inicio": request.fecha_inicio.isoformat() if request.fecha_inicio else None,
        "fecha_fin": request.fecha_fin.isoformat() if request.fecha_fin else None
    }
    
    result = await simulate_scenario(scenario, current_data)
    
    return SimulationResult(
        scenario_name=result.get("scenario_name", request.scenario_name),
        results=result.get("results", {}),
        impact_analysis=result.get("impact_analysis", {}),
        recommendations=result.get("recommendations", []),
        simulated_at=datetime.utcnow()
    )
