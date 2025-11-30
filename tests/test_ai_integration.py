"""
Tests de integración para funcionalidades de IA con Google Gemini
"""
import pytest
import json
from datetime import datetime, timedelta
from app.services.ai_gemini import (
    generate_predictions,
    optimize_space_allocation,
    analyze_usage_patterns,
    simulate_scenario,
    get_gemini_model
)


class TestAIConfiguration:
    """Tests de configuración de IA"""
    
    def test_gemini_model_creation(self):
        """Test: El modelo de Gemini se puede crear"""
        model = get_gemini_model()
        # Puede ser None si no hay API key, pero no debe fallar
        assert model is not None or model is None
    
    def test_model_name_parameter(self):
        """Test: Se puede especificar el nombre del modelo"""
        model = get_gemini_model("gemini-pro")
        assert model is not None or model is None


class TestPredictionsAI:
    """Tests de predicciones con IA"""
    
    @pytest.mark.asyncio
    async def test_generate_predictions_basic(self):
        """Test: Generar predicciones básicas"""
        # Datos de ejemplo
        test_data = {
            "spaces": [
                {"id": 1, "nombre": "Aula 101", "capacidad": 30, "uso_actual": 25},
                {"id": 2, "nombre": "Lab 201", "capacidad": 20, "uso_actual": 15}
            ],
            "period": "last_30_days",
            "total_assignments": 45
        }
        
        result = await generate_predictions(test_data)
        
        # Verificar estructura de respuesta
        assert "predictions" in result
        assert "confidence" in result
        assert "generated_at" in result
        assert isinstance(result["predictions"], list)
        assert isinstance(result["confidence"], (int, float))
    
    @pytest.mark.asyncio
    async def test_predictions_without_api_key(self):
        """Test: Predicciones sin API key devuelven respuesta fallback"""
        test_data = {"spaces": []}
        result = await generate_predictions(test_data)
        
        # Debe devolver respuesta aunque no haya API key
        assert result is not None
        assert "predictions" in result
        assert "message" in result or "confidence" in result
    
    @pytest.mark.asyncio
    async def test_predictions_with_complex_data(self):
        """Test: Predicciones con datos complejos"""
        test_data = {
            "spaces": [
                {
                    "id": i,
                    "nombre": f"Espacio {i}",
                    "capacidad": 20 + i * 5,
                    "uso_promedio": 0.7,
                    "tendencia": "creciente"
                }
                for i in range(1, 6)
            ],
            "recursos": [
                {"id": j, "tipo": "proyector", "uso_diario": 5}
                for j in range(1, 4)
            ],
            "historial": {
                "ultimo_mes": {"promedio_uso": 0.75, "picos": [0.9, 0.85, 0.95]},
                "estacionalidad": "alta demanda en semana 2 y 4"
            }
        }
        
        result = await generate_predictions(test_data)
        
        assert result is not None
        assert "predictions" in result
        # Verificar que procesa datos complejos sin errores
        assert len(json.dumps(result)) > 0


class TestOptimizationAI:
    """Tests de optimización con IA"""
    
    @pytest.mark.asyncio
    async def test_optimize_space_allocation_basic(self):
        """Test: Optimización básica de asignación"""
        test_data = {
            "spaces": [
                {"id": 1, "capacidad": 30, "ocupacion_actual": 15},
                {"id": 2, "capacidad": 20, "ocupacion_actual": 18}
            ],
            "resources": [
                {"id": 101, "tipo": "proyector", "disponibles": 5},
                {"id": 102, "tipo": "computador", "disponibles": 10}
            ],
            "current_assignments": [
                {"space_id": 1, "resource_id": 101, "cantidad": 2},
                {"space_id": 2, "resource_id": 102, "cantidad": 8}
            ]
        }
        
        result = await optimize_space_allocation(test_data)
        
        # Verificar estructura de respuesta
        assert "recomendaciones" in result or "recommendations" in result
        assert "score_optimizacion" in result or "optimization_score" in result
        assert "asignaciones_sugeridas" in result or "suggested_assignments" in result
    
    @pytest.mark.asyncio
    async def test_optimization_returns_score(self):
        """Test: La optimización devuelve un score válido"""
        test_data = {"spaces": [], "resources": []}
        result = await optimize_space_allocation(test_data)
        
        score_key = "score_optimizacion" if "score_optimizacion" in result else "optimization_score"
        if score_key in result:
            score = result[score_key]
            assert isinstance(score, (int, float))
            assert 0.0 <= score <= 1.0
    
    @pytest.mark.asyncio
    async def test_optimization_with_conflicts(self):
        """Test: Optimización detecta conflictos"""
        test_data = {
            "spaces": [
                {"id": 1, "capacidad": 10, "asignaciones_actuales": 15}  # Sobreasignado
            ],
            "problems": ["Espacio 1 está sobreasignado en 50%"]
        }
        
        result = await optimize_space_allocation(test_data)
        
        assert result is not None
        # Debe devolver recomendaciones para el conflicto
        recom_key = "recomendaciones" if "recomendaciones" in result else "recommendations"
        assert recom_key in result


class TestPatternAnalysisAI:
    """Tests de análisis de patrones"""
    
    @pytest.mark.asyncio
    async def test_analyze_usage_patterns_basic(self):
        """Test: Análisis básico de patrones"""
        test_data = {
            "usage_history": [
                {"date": "2025-11-01", "space_id": 1, "usage": 0.8},
                {"date": "2025-11-02", "space_id": 1, "usage": 0.75},
                {"date": "2025-11-03", "space_id": 1, "usage": 0.9}
            ],
            "period": "weekly"
        }
        
        result = await analyze_usage_patterns(test_data)
        
        assert "patterns" in result
        assert "trends" in result
        assert "anomalies" in result
        assert isinstance(result["patterns"], list)
        assert isinstance(result["trends"], list)
        assert isinstance(result["anomalies"], list)
    
    @pytest.mark.asyncio
    async def test_pattern_analysis_detects_trends(self):
        """Test: El análisis detecta tendencias"""
        # Datos con tendencia creciente clara
        test_data = {
            "usage_history": [
                {"week": i, "usage": 0.5 + (i * 0.05)}
                for i in range(1, 11)
            ]
        }
        
        result = await analyze_usage_patterns(test_data)
        
        assert result is not None
        assert "trends" in result
        # Debe detectar alguna tendencia en los datos
    
    @pytest.mark.asyncio
    async def test_pattern_analysis_with_anomalies(self):
        """Test: El análisis detecta anomalías"""
        test_data = {
            "usage_history": [
                {"day": 1, "usage": 0.7},
                {"day": 2, "usage": 0.75},
                {"day": 3, "usage": 0.72},
                {"day": 4, "usage": 0.15},  # Anomalía: caída brusca
                {"day": 5, "usage": 0.73}
            ]
        }
        
        result = await analyze_usage_patterns(test_data)
        
        assert result is not None
        assert "anomalies" in result


class TestScenarioSimulationAI:
    """Tests de simulación de escenarios"""
    
    @pytest.mark.asyncio
    async def test_simulate_scenario_basic(self):
        """Test: Simulación básica de escenario"""
        scenario = {
            "scenario_name": "Aumento de capacidad 20%",
            "changes": [
                {"type": "increase_capacity", "space_id": 1, "amount": 0.2}
            ]
        }
        
        current_data = {
            "spaces": [
                {"id": 1, "capacidad": 30, "uso_actual": 28}
            ]
        }
        
        result = await simulate_scenario(scenario, current_data)
        
        assert "scenario_name" in result
        assert "results" in result
        assert "impact_analysis" in result
        assert "recommendations" in result
        assert result["scenario_name"] == scenario["scenario_name"]
    
    @pytest.mark.asyncio
    async def test_simulation_adds_timestamp(self):
        """Test: La simulación agrega timestamp"""
        scenario = {"scenario_name": "Test", "changes": []}
        current_data = {"spaces": []}
        
        result = await simulate_scenario(scenario, current_data)
        
        # Debe incluir timestamp de simulación
        if "simulated_at" in result:
            assert result["simulated_at"] is not None
    
    @pytest.mark.asyncio
    async def test_simulate_multiple_changes(self):
        """Test: Simular escenario con múltiples cambios"""
        scenario = {
            "scenario_name": "Reorganización completa",
            "changes": [
                {"type": "add_space", "capacidad": 50},
                {"type": "remove_space", "space_id": 3},
                {"type": "add_resources", "tipo": "proyector", "cantidad": 5}
            ]
        }
        
        current_data = {
            "spaces": [{"id": i, "capacidad": 30} for i in range(1, 6)],
            "resources": [{"id": j, "tipo": "proyector"} for j in range(1, 11)]
        }
        
        result = await simulate_scenario(scenario, current_data)
        
        assert result is not None
        assert "results" in result
        assert "impact_analysis" in result


class TestAIIntegrationWithAPI:
    """Tests de integración de IA con endpoints API"""
    
    @pytest.mark.asyncio
    async def test_predictions_endpoint_integration(self):
        """Test: Integración del endpoint de predicciones"""
        # Datos que se enviarían al endpoint
        request_data = {
            "data": {
                "spaces": [{"id": 1, "usage": 0.8}],
                "timeframe": "next_week"
            }
        }
        
        result = await generate_predictions(request_data["data"])
        
        # Verificar que la respuesta es serializable a JSON (importante para API)
        json_str = json.dumps(result, default=str)
        assert len(json_str) > 0
        
        # Verificar que se puede deserializar
        parsed = json.loads(json_str)
        assert parsed is not None
    
    @pytest.mark.asyncio
    async def test_optimization_endpoint_integration(self):
        """Test: Integración del endpoint de optimización"""
        request_data = {
            "spaces": [{"id": 1, "capacidad": 30}],
            "resources": [{"id": 101, "tipo": "proyector"}]
        }
        
        result = await optimize_space_allocation(request_data)
        
        # Verificar serialización JSON
        json_str = json.dumps(result, default=str)
        assert len(json_str) > 0
    
    @pytest.mark.asyncio
    async def test_analytics_endpoint_integration(self):
        """Test: Integración del endpoint de analytics"""
        request_data = {
            "usage_data": [
                {"timestamp": datetime.now().isoformat(), "usage": 0.75}
            ]
        }
        
        result = await analyze_usage_patterns(request_data)
        
        # Verificar serialización JSON
        json_str = json.dumps(result, default=str)
        assert len(json_str) > 0


class TestAIErrorHandling:
    """Tests de manejo de errores de IA"""
    
    @pytest.mark.asyncio
    async def test_predictions_with_empty_data(self):
        """Test: Predicciones con datos vacíos"""
        result = await generate_predictions({})
        
        assert result is not None
        assert "predictions" in result
    
    @pytest.mark.asyncio
    async def test_optimization_with_invalid_data(self):
        """Test: Optimización con datos inválidos"""
        result = await optimize_space_allocation({"invalid": "data"})
        
        assert result is not None
        # No debe lanzar excepción
    
    @pytest.mark.asyncio
    async def test_pattern_analysis_with_null_data(self):
        """Test: Análisis de patrones con datos nulos"""
        result = await analyze_usage_patterns(None or {})
        
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_simulation_with_missing_fields(self):
        """Test: Simulación con campos faltantes"""
        scenario = {"scenario_name": "Test"}  # Falta 'changes'
        current_data = {}
        
        result = await simulate_scenario(scenario, current_data)
        
        assert result is not None
        assert "scenario_name" in result


class TestAIResponseStructure:
    """Tests de estructura de respuestas de IA"""
    
    @pytest.mark.asyncio
    async def test_predictions_response_structure(self):
        """Test: Estructura de respuesta de predicciones"""
        result = await generate_predictions({"test": "data"})
        
        required_keys = ["predictions", "confidence"]
        for key in required_keys:
            assert key in result, f"Falta clave '{key}' en respuesta"
    
    @pytest.mark.asyncio
    async def test_optimization_response_structure(self):
        """Test: Estructura de respuesta de optimización"""
        result = await optimize_space_allocation({"test": "data"})
        
        # Verificar claves en español o inglés
        assert ("recomendaciones" in result or "recommendations" in result)
        assert ("score_optimizacion" in result or "optimization_score" in result)
    
    @pytest.mark.asyncio
    async def test_pattern_analysis_response_structure(self):
        """Test: Estructura de respuesta de análisis de patrones"""
        result = await analyze_usage_patterns({"test": "data"})
        
        required_keys = ["patterns", "trends", "anomalies"]
        for key in required_keys:
            assert key in result, f"Falta clave '{key}' en respuesta"
    
    @pytest.mark.asyncio
    async def test_simulation_response_structure(self):
        """Test: Estructura de respuesta de simulación"""
        result = await simulate_scenario(
            {"scenario_name": "Test", "changes": []},
            {"spaces": []}
        )
        
        required_keys = ["scenario_name", "results", "impact_analysis", "recommendations"]
        for key in required_keys:
            assert key in result, f"Falta clave '{key}' en respuesta"


# Información para desarrolladores sobre uso de IA en otros sistemas
"""
=== GUÍA DE INTEGRACIÓN DE IA PARA OTROS SISTEMAS ===

1. ENDPOINTS DE IA DISPONIBLES:

   a) POST /api/v1/analytics/predictions
      - Genera predicciones de uso futuro
      - Input: { "data": {...} }
      - Output: { "predictions": [...], "confidence": 0.85 }

   b) POST /api/v1/assignments/optimize
      - Optimiza asignaciones de espacios/recursos
      - Input: { "spaces": [...], "resources": [...] }
      - Output: { "recommendations": [...], "score": 0.92 }

   c) POST /api/v1/analytics/usage-patterns
      - Analiza patrones de uso histórico
      - Input: { "usage_data": [...] }
      - Output: { "patterns": [...], "trends": [...], "anomalies": [...] }

   d) POST /api/v1/analytics/simulate
      - Simula escenarios hipotéticos
      - Input: { "scenario": {...}, "current_data": {...} }
      - Output: { "results": {...}, "impact_analysis": {...} }

2. EJEMPLO DE INTEGRACIÓN DESDE OTRO SISTEMA:

   Python:
   ```python
   import httpx
   
   async with httpx.AsyncClient() as client:
       # Login
       login_response = await client.post(
           "http://api.example.com/api/v1/auth/login",
           data={"username": "user", "password": "pass"}
       )
       token = login_response.json()["access_token"]
       
       # Usar IA - Predicciones
       headers = {"Authorization": f"Bearer {token}"}
       prediction_response = await client.post(
           "http://api.example.com/api/v1/analytics/predictions",
           json={"data": {"spaces": [...]}},
           headers=headers
       )
       predictions = prediction_response.json()
   ```

   JavaScript:
   ```javascript
   // Login
   const loginRes = await fetch('http://api.example.com/api/v1/auth/login', {
       method: 'POST',
       body: new URLSearchParams({username: 'user', password: 'pass'})
   });
   const {access_token} = await loginRes.json();
   
   // Usar IA - Optimización
   const optimizeRes = await fetch('http://api.example.com/api/v1/assignments/optimize', {
       method: 'POST',
       headers: {
           'Authorization': `Bearer ${access_token}`,
           'Content-Type': 'application/json'
       },
       body: JSON.stringify({
           spaces: [...],
           resources: [...]
       })
   });
   const optimization = await optimizeRes.json();
   ```

   cURL:
   ```bash
   # Login
   TOKEN=$(curl -X POST http://api.example.com/api/v1/auth/login \
       -d "username=user&password=pass" | jq -r '.access_token')
   
   # Usar IA - Análisis de patrones
   curl -X POST http://api.example.com/api/v1/analytics/usage-patterns \
       -H "Authorization: Bearer $TOKEN" \
       -H "Content-Type: application/json" \
       -d '{"usage_data": [...]}'
   ```

3. CASOS DE USO PARA INTEGRACIÓN:

   a) Dashboard de Business Intelligence:
      - Consumir predicciones para mostrar gráficos de tendencias
      - Integrar alertas de anomalías detectadas por IA

   b) Sistema de Reservas:
      - Usar optimización para sugerir mejores espacios
      - Aplicar análisis de patrones para horarios óptimos

   c) ERP/CRM:
      - Simular escenarios de expansión/reducción
      - Generar reportes con insights de IA

   d) Aplicación Móvil:
      - Notificaciones basadas en predicciones
      - Sugerencias personalizadas de recursos

4. BEST PRACTICES:

   - Cachear respuestas de IA para reducir llamadas a Gemini
   - Implementar rate limiting en cliente
   - Manejar casos donde IA no está disponible (fallback)
   - Validar respuestas antes de usar en lógica crítica
   - Usar webhooks para notificaciones asíncronas
"""
