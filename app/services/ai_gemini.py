import os
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

import google.generativeai as genai
from pydantic import BaseModel

from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini once at module level
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY not configured. AI features will be limited.")


def get_gemini_model(model_name: str = "gemini-2.0-flash"):
    """Get configured Gemini model instance."""
    if not settings.GEMINI_API_KEY:
        return None
    try:
        return genai.GenerativeModel(model_name)
    except Exception as e:
        logger.error(f"Error creating Gemini model: {e}")
        return None


class PredictionResponse(BaseModel):
    predictions: List[Dict[str, Any]]
    confidence: float
    insights: List[str]


class OptimizationResponse(BaseModel):
    recommendations: List[Dict[str, Any]]
    optimization_score: float
    suggested_assignments: List[Dict[str, Any]]


class PatternAnalysisResponse(BaseModel):
    patterns: List[Dict[str, Any]]
    trends: List[str]
    anomalies: List[Dict[str, Any]]


async def generate_predictions(data: Dict[str, Any]) -> Dict[str, Any]:
    model = get_gemini_model()
    
    if not model:
        return {
            "predictions": [],
            "confidence": 0.0,
            "message": "AI service not configured. Please set GEMINI_API_KEY.",
            "model_used": "none",
            "generated_at": datetime.utcnow().isoformat()
        }

    prompt = f"""Analiza los siguientes datos de uso de espacios y recursos, y genera predicciones para los próximos períodos.

Datos actuales:
{json.dumps(data, indent=2, default=str)}

Genera predicciones en formato JSON con la siguiente estructura:
{{
    "predictions": [
        {{
            "entity_type": "space/resource",
            "entity_id": <id>,
            "predicted_usage": <valor>,
            "period": "próximo día/semana/mes",
            "factors": ["factor1", "factor2"]
        }}
    ],
    "confidence": <0.0-1.0>,
    "insights": ["insight1", "insight2", "insight3"]
}}

Responde SOLO con el JSON válido."""

    try:
        response = model.generate_content(prompt)
        
        if response.text:
            result = json.loads(response.text)
            result["model_used"] = "gemini-2.0-flash"
            result["generated_at"] = datetime.utcnow().isoformat()
            return result
        
        return {
            "predictions": [],
            "confidence": 0.0,
            "message": "No response from AI model",
            "model_used": "gemini-2.0-flash",
            "generated_at": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error generating predictions: {e}")
        return {
            "predictions": [],
            "confidence": 0.0,
            "message": f"Error: {str(e)}",
            "model_used": "gemini-2.0-flash",
            "generated_at": datetime.utcnow().isoformat()
        }


async def optimize_space_allocation(data: Dict[str, Any]) -> Dict[str, Any]:
    model = get_gemini_model()
    
    if not model:
        return {
            "recomendaciones": [],
            "score_optimizacion": 0.0,
            "mensaje": "AI service not configured. Please set GEMINI_API_KEY.",
            "asignaciones_sugeridas": []
        }

    prompt = f"""Eres un experto en optimización de espacios físicos. Analiza los siguientes datos y proporciona recomendaciones de optimización.

Datos de espacios, recursos y asignaciones actuales:
{json.dumps(data, indent=2, default=str)}

Genera recomendaciones de optimización en formato JSON:
{{
    "recomendaciones": [
        {{
            "tipo": "reasignación/consolidación/expansión",
            "descripcion": "descripción detallada",
            "prioridad": "alta/media/baja",
            "impacto_estimado": "descripción del impacto"
        }}
    ],
    "score_optimizacion": <0.0-1.0>,
    "mensaje": "resumen de la optimización",
    "asignaciones_sugeridas": [
        {{
            "space_id": <id>,
            "resource_id": <id>,
            "razon": "justificación"
        }}
    ]
}}

Responde SOLO con el JSON válido."""

    try:
        response = model.generate_content(prompt)
        
        if response.text:
            return json.loads(response.text)
        
        return {
            "recomendaciones": [],
            "score_optimizacion": 0.0,
            "mensaje": "No response from AI model",
            "asignaciones_sugeridas": []
        }

    except Exception as e:
        logger.error(f"Error optimizing allocation: {e}")
        return {
            "recomendaciones": [],
            "score_optimizacion": 0.0,
            "mensaje": f"Error: {str(e)}",
            "asignaciones_sugeridas": []
        }


async def analyze_usage_patterns(data: Dict[str, Any]) -> Dict[str, Any]:
    model = get_gemini_model()
    
    if not model:
        return {
            "patterns": [],
            "trends": [],
            "anomalies": [],
            "message": "AI service not configured. Please set GEMINI_API_KEY."
        }

    prompt = f"""Analiza los patrones de uso en los siguientes datos de espacios y recursos:

{json.dumps(data, indent=2, default=str)}

Identifica patrones, tendencias y anomalías. Responde en formato JSON:
{{
    "patterns": [
        {{
            "nombre": "nombre del patrón",
            "descripcion": "descripción detallada",
            "frecuencia": "diaria/semanal/mensual",
            "entidades_afectadas": ["space_1", "resource_2"]
        }}
    ],
    "trends": [
        "tendencia 1",
        "tendencia 2"
    ],
    "anomalies": [
        {{
            "tipo": "tipo de anomalía",
            "descripcion": "descripción",
            "severidad": "alta/media/baja",
            "fecha_detectada": "fecha"
        }}
    ],
    "resumen": "resumen del análisis"
}}

Responde SOLO con el JSON válido."""

    try:
        response = model.generate_content(prompt)
        
        if response.text:
            return json.loads(response.text)
        
        return {
            "patterns": [],
            "trends": [],
            "anomalies": [],
            "message": "No response from AI model"
        }

    except Exception as e:
        logger.error(f"Error analyzing patterns: {e}")
        return {
            "patterns": [],
            "trends": [],
            "anomalies": [],
            "message": f"Error: {str(e)}"
        }


async def simulate_scenario(scenario: Dict[str, Any], current_data: Dict[str, Any]) -> Dict[str, Any]:
    model = get_gemini_model()
    
    if not model:
        return {
            "scenario_name": scenario.get("scenario_name", "Unknown"),
            "results": {},
            "impact_analysis": {},
            "recommendations": [],
            "message": "AI service not configured. Please set GEMINI_API_KEY."
        }

    prompt = f"""Simula el siguiente escenario y analiza su impacto en el sistema de gestión de espacios:

Escenario a simular:
{json.dumps(scenario, indent=2, default=str)}

Datos actuales del sistema:
{json.dumps(current_data, indent=2, default=str)}

Analiza el impacto y proporciona resultados en formato JSON:
{{
    "scenario_name": "{scenario.get('scenario_name', 'Simulation')}",
    "results": {{
        "espacios_afectados": <numero>,
        "recursos_afectados": <numero>,
        "cambio_eficiencia": <porcentaje>,
        "cambio_capacidad": <porcentaje>
    }},
    "impact_analysis": {{
        "positivo": ["impacto positivo 1", "impacto positivo 2"],
        "negativo": ["impacto negativo 1"],
        "neutro": ["impacto neutro 1"]
    }},
    "recommendations": [
        "recomendación 1",
        "recomendación 2"
    ],
    "viabilidad": "alta/media/baja"
}}

Responde SOLO con el JSON válido."""

    try:
        response = model.generate_content(prompt)
        
        if response.text:
            result = json.loads(response.text)
            result["simulated_at"] = datetime.utcnow().isoformat()
            return result
        
        return {
            "scenario_name": scenario.get("scenario_name", "Unknown"),
            "results": {},
            "impact_analysis": {},
            "recommendations": [],
            "message": "No response from AI model"
        }

    except Exception as e:
        logger.error(f"Error simulating scenario: {e}")
        return {
            "scenario_name": scenario.get("scenario_name", "Unknown"),
            "results": {},
            "impact_analysis": {},
            "recommendations": [],
            "message": f"Error: {str(e)}"
        }

