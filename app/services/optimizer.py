from typing import List, Dict, Any, Optional
from datetime import datetime
import random


class SpaceOptimizer:
    
    def __init__(self):
        self.weights = {
            "capacity_match": 0.3,
            "location_proximity": 0.2,
            "resource_compatibility": 0.25,
            "usage_history": 0.15,
            "cost_efficiency": 0.1
        }

    def calculate_assignment_score(
        self,
        space: Dict[str, Any],
        resource: Dict[str, Any],
        existing_assignments: List[Dict[str, Any]]
    ) -> float:
        score = 0.0
        
        capacity_score = self._calculate_capacity_score(space, resource)
        score += capacity_score * self.weights["capacity_match"]
        
        compatibility_score = self._calculate_compatibility_score(space, resource)
        score += compatibility_score * self.weights["resource_compatibility"]
        
        usage_score = self._calculate_usage_score(space, existing_assignments)
        score += usage_score * self.weights["usage_history"]
        
        location_score = self._calculate_location_score(space)
        score += location_score * self.weights["location_proximity"]
        
        cost_score = self._calculate_cost_score(space, resource)
        score += cost_score * self.weights["cost_efficiency"]
        
        return min(1.0, max(0.0, score))

    def _calculate_capacity_score(self, space: Dict[str, Any], resource: Dict[str, Any]) -> float:
        capacity = space.get("capacidad", 0)
        if capacity <= 0:
            return 0.0
        
        # caracteristicas ahora es una lista, usar valor por defecto
        resource_requirements = 1
        
        if resource_requirements <= capacity:
            efficiency = resource_requirements / capacity
            return 0.5 + (0.5 * efficiency)
        return 0.0

    def _calculate_compatibility_score(self, space: Dict[str, Any], resource: Dict[str, Any]) -> float:
        space_type = space.get("tipo", "").lower()
        resource_type = resource.get("tipo", "").lower()
        
        compatibility_matrix = {
            "office": ["computadora", "mobiliario", "equipo de oficina"],
            "oficina": ["computadora", "mobiliario", "equipo de oficina"],
            "conference": ["proyector", "pizarra", "sistema de videoconferencia"],
            "sala de reuniones": ["proyector", "pizarra", "sistema de videoconferencia"],
            "laboratory": ["equipo científico", "instrumentos", "computadora"],
            "laboratorio": ["equipo científico", "instrumentos", "computadora"],
            "classroom": ["proyector", "computadora", "pizarra"],
            "auditorium": ["sistema de audio", "proyector", "iluminación"],
            "auditorio": ["sistema de audio", "proyector", "iluminación"]
        }
        
        compatible_resources = compatibility_matrix.get(space_type, [])
        
        if resource_type in compatible_resources:
            return 1.0
        elif any(resource_type in r or r in resource_type for r in compatible_resources):
            return 0.7
        return 0.3

    def _calculate_usage_score(self, space: Dict[str, Any], assignments: List[Dict[str, Any]]) -> float:
        space_id = space.get("id")
        # Assignments usan room_id, no space_id
        space_assignments = [a for a in assignments if a.get("room_id") == space_id]
        
        if not space_assignments:
            return 1.0
        
        active_count = sum(1 for a in space_assignments if a.get("estado") == "activo")
        capacity = space.get("capacidad", 1)
        
        utilization = active_count / capacity if capacity > 0 else 0
        
        if utilization < 0.7:
            return 1.0
        elif utilization < 0.9:
            return 0.6
        else:
            return 0.2

    def _calculate_location_score(self, space: Dict[str, Any]) -> float:
        ubicacion = space.get("ubicacion", "")
        
        if "planta baja" in ubicacion.lower() or "piso 1" in ubicacion.lower():
            return 1.0
        elif "piso 2" in ubicacion.lower() or "piso 3" in ubicacion.lower():
            return 0.8
        return 0.6

    def _calculate_cost_score(self, space: Dict[str, Any], resource: Dict[str, Any]) -> float:
        # caracteristicas es ahora una lista, usar valores por defecto
        space_cost = 10
        resource_value = 100
        
        # Asignar puntaje base
        return 0.8

    def optimize_assignments(
        self,
        spaces: List[Dict[str, Any]],
        resources: List[Dict[str, Any]],
        existing_assignments: List[Dict[str, Any]],
        criteria: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if criteria:
            self._update_weights(criteria)
        
        available_spaces = [s for s in spaces if s.get("estado") == "disponible"]
        available_resources = [r for r in resources if r.get("estado") == "disponible"]
        
        recommendations = []
        suggested_assignments = []
        total_score = 0.0
        
        for resource in available_resources:
            best_space = None
            best_score = 0.0
            
            for space in available_spaces:
                score = self.calculate_assignment_score(space, resource, existing_assignments)
                if score > best_score:
                    best_score = score
                    best_space = space
            
            if best_space and best_score > 0.5:
                suggested_assignments.append({
                    "space_id": best_space["id"],
                    "space_nombre": best_space["nombre"],
                    "resource_id": resource["id"],
                    "resource_nombre": resource["nombre"],
                    "score": round(best_score, 3),
                    "razon": f"Score de compatibilidad: {best_score:.2%}"
                })
                total_score += best_score
                
                if best_score > 0.8:
                    recommendations.append({
                        "space_name": best_space['nombre'],
                        "reason": f"Assign {resource['nombre']} - High compatibility score ({best_score:.2%})",
                        "priority": "high",
                        "tipo": "asignación_óptima",
                        "descripcion": f"Asignar {resource['nombre']} a {best_space['nombre']}",
                        "prioridad": "alta",
                        "impacto_estimado": "Mejora significativa en eficiencia"
                    })
                elif best_score > 0.6:
                    recommendations.append({
                        "space_name": best_space['nombre'],
                        "reason": f"Consider assigning {resource['nombre']} - Good compatibility ({best_score:.2%})",
                        "priority": "medium",
                        "tipo": "asignación_recomendada",
                        "descripcion": f"Considerar asignar {resource['nombre']} a {best_space['nombre']}",
                        "prioridad": "media",
                        "impacto_estimado": "Mejora moderada en eficiencia"
                    })
        
        underutilized_spaces = self._find_underutilized_spaces(spaces, existing_assignments)
        for space in underutilized_spaces:
            recommendations.append({
                "space_name": space['nombre'],
                "reason": "Space is underutilized - potential cost savings",
                "priority": "low",
                "tipo": "consolidación",
                "descripcion": f"Espacio {space['nombre']} está subutilizado",
                "prioridad": "baja",
                "impacto_estimado": "Potencial ahorro de costos"
            })
        
        avg_score = total_score / len(suggested_assignments) if suggested_assignments else 0.0
        estimated_improvement = avg_score * 100 if avg_score > 0 else 0.0
        
        return {
            "recommendations": recommendations,
            "estimated_improvement": round(estimated_improvement, 1),
            "optimization_score": round(avg_score, 3),
            "model_used": "local-optimizer",
            "generated_at": datetime.utcnow().isoformat(),
            "recomendaciones": recommendations,
            "score_optimizacion": round(avg_score, 3),
            "mensaje": f"Se encontraron {len(suggested_assignments)} asignaciones óptimas de {len(available_resources)} recursos disponibles",
            "asignaciones_sugeridas": suggested_assignments
        }

    def _update_weights(self, criteria: Dict[str, Any]):
        for key, value in criteria.items():
            if key in self.weights and isinstance(value, (int, float)):
                self.weights[key] = max(0.0, min(1.0, value))
        
        total = sum(self.weights.values())
        if total > 0:
            self.weights = {k: v / total for k, v in self.weights.items()}

    def _find_underutilized_spaces(
        self,
        spaces: List[Dict[str, Any]],
        assignments: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        underutilized = []
        
        for space in spaces:
            space_assignments = [a for a in assignments if a.get("space_id") == space.get("id")]
            active = sum(1 for a in space_assignments if a.get("estado") == "activo")
            capacity = space.get("capacidad", 1)
            
            if capacity > 0 and (active / capacity) < 0.3:
                underutilized.append(space)
        
        return underutilized


optimizer = SpaceOptimizer()
