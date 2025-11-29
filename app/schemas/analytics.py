from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class UsageAnalytics(BaseModel):
    total_spaces: int
    total_resources: int
    spaces_in_use: int
    resources_in_use: int
    average_usage: float
    usage_by_type: Dict[str, Any]
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None


class EfficiencyMetrics(BaseModel):
    overall_efficiency: float
    space_efficiency: float
    resource_efficiency: float
    optimization_score: float
    recommendations: List[str]
    metrics_by_space: Optional[List[Dict[str, Any]]] = None


class PredictionResult(BaseModel):
    predictions: List[Dict[str, Any]]
    confidence: float
    model_used: str
    generated_at: datetime


class SimulationRequest(BaseModel):
    scenario_name: str
    parameters: Dict[str, Any]
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None


class SimulationResult(BaseModel):
    scenario_name: str
    results: Dict[str, Any]
    impact_analysis: Dict[str, Any]
    recommendations: List[str]
    simulated_at: datetime
