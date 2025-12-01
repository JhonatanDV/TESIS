from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import json
import logging
import asyncio
import math
from concurrent.futures import ThreadPoolExecutor

import google.generativeai as genai

from app.db.session import get_db
from app.db.crud import SpaceCRUD
from app.config import settings
from app.api.v1.auth import get_current_active_user

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chatbot", tags=["Chatbot IA"])

# Modelo de Gemini a usar
GEMINI_MODEL = "gemini-2.0-flash"

# Thread pool para ejecutar llamadas síncronas a Gemini
executor = ThreadPoolExecutor(max_workers=3)


class ChatMessage(BaseModel):
    message: str
    context: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    suggestions: List[str] = []
    timestamp: str
    model_used: str
    spaces_mentioned: List[dict] = []


class GeminiTestResponse(BaseModel):
    status: str
    message: str
    api_key_configured: bool
    model_available: bool
    test_response: Optional[str] = None
    error: Optional[str] = None


# ==================== MODELOS PARA PROGRAMADOR DE CLASES ====================

class ClassScheduleEntry(BaseModel):
    """Entrada de una materia/clase para programar"""
    id: str
    materia: str
    semestre: str
    estudiantes: int
    tipo_espacio: str  # aula, laboratorio, auditorio
    dias: List[str]  # ['Lunes', 'Miércoles', 'Viernes']
    hora_inicio: str  # '08:00'
    hora_fin: str  # '10:00'
    duracion: int  # minutos
    equipamiento: List[str] = []  # ['proyector', 'computadores', etc.]


class ScheduleClassesRequest(BaseModel):
    """Solicitud para programar múltiples clases"""
    materias: List[ClassScheduleEntry]
    fecha_inicio: str  # Fecha de inicio del semestre YYYY-MM-DD
    fecha_fin: str  # Fecha de fin del semestre YYYY-MM-DD
    evitar_conflictos: bool = True
    optimizar_uso_espacios: bool = True
    preferencias_adicionales: Optional[str] = None


class ScheduledClass(BaseModel):
    """Una clase programada con su espacio asignado"""
    materia_id: str
    materia: str
    semestre: str
    espacio_asignado: str
    espacio_id: Optional[int] = None
    dia: str
    hora_inicio: str
    hora_fin: str
    capacidad_espacio: int
    estudiantes: int
    equipamiento_disponible: List[str] = []
    notas: Optional[str] = None


class ScheduleConflict(BaseModel):
    """Conflicto detectado en la programación"""
    tipo: str  # 'horario', 'espacio', 'capacidad'
    descripcion: str
    materias_afectadas: List[str]
    sugerencia: str


class ScheduleClassesResponse(BaseModel):
    """Respuesta de la programación de clases"""
    success: bool
    mensaje: str
    clases_programadas: List[ScheduledClass] = []
    conflictos: List[ScheduleConflict] = []
    espacios_utilizados: List[dict] = []
    resumen: dict = {}
    recomendaciones: List[str] = []
    horario_generado: Optional[dict] = None
    model_used: str = "gemini-2.0-flash"
    timestamp: str = ""


@router.get("/test-gemini", response_model=GeminiTestResponse, summary="Probar conexión con Gemini")
async def test_gemini_connection():
    """
    Prueba la conexión con la API de Gemini.
    
    Verifica:
    - Si la API key está configurada
    - Si el modelo está disponible
    - Si se puede generar una respuesta de prueba
    """
    result = {
        "status": "checking",
        "message": "",
        "api_key_configured": False,
        "model_available": False,
        "test_response": None,
        "error": None
    }
    
    # Verificar API key
    if not settings.GEMINI_API_KEY:
        result["status"] = "error"
        result["message"] = "GEMINI_API_KEY no está configurada en el archivo .env"
        return GeminiTestResponse(**result)
    
    result["api_key_configured"] = True
    logger.info(f"API Key configurada: {settings.GEMINI_API_KEY[:10]}...")
    
    try:
        # Configurar Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # Crear modelo
        model = genai.GenerativeModel("gemini-2.0-flash")
        result["model_available"] = True
        
        # Hacer una petición de prueba simple (ejecutar en thread pool para async)
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            executor,
            lambda: model.generate_content("Di 'Hola, estoy funcionando correctamente' en español")
        )
        
        if response and response.text:
            result["status"] = "success"
            result["message"] = "Conexión exitosa con Gemini API"
            result["test_response"] = response.text
            logger.info(f"Respuesta de Gemini: {response.text}")
        else:
            result["status"] = "warning"
            result["message"] = "Modelo disponible pero sin respuesta"
            
    except Exception as e:
        result["status"] = "error"
        result["message"] = f"Error al conectar con Gemini: {str(e)}"
        result["error"] = str(e)
        logger.error(f"Error en test de Gemini: {e}")
    
    return GeminiTestResponse(**result)


@router.post("/chat", response_model=ChatResponse, summary="Chat con el asistente IA")
async def chat_with_assistant(
    chat_message: ChatMessage,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Envía un mensaje al asistente IA basado en Gemini.
    
    El asistente puede ayudar con:
    - Información sobre espacios disponibles
    - Recomendaciones de espacios según necesidades
    - Información sobre equipos y características
    - Consultas generales sobre el sistema
    """
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de IA no configurado. Contacte al administrador."
        )
    
    try:
        # Obtener información de espacios para contexto
        all_spaces = await SpaceCRUD.get_all(db)
        
        # Crear resumen de espacios para el contexto
        spaces_summary = []
        for space in all_spaces[:20]:  # Limitar a 20 espacios para el contexto
            spaces_summary.append({
                "id": space.id,
                "nombre": space.nombre,
                "tipo": space.tipo,
                "capacidad": space.capacidad,
                "ubicacion": space.ubicacion,
                "estado": space.estado,
                "disponible": space.estado == "disponible",
                "caracteristicas": space.caracteristicas if space.caracteristicas else []
            })
        
        # Configurar Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")
        
        # Obtener nombre del usuario
        user_name = current_user.nombre_completo or current_user.username
        
        # Crear el prompt con contexto
        system_context = f"""Eres un asistente virtual inteligente del Sistema de Gestión de Espacios Físicos "SpaceIQ".
Tu rol es ayudar a los usuarios a:
1. Encontrar espacios disponibles según sus necesidades
2. Proporcionar información sobre las características y equipos de los espacios
3. Dar recomendaciones basadas en capacidad, tipo de espacio y equipamiento
4. Responder preguntas sobre el sistema

Información actual de espacios disponibles (total: {len(all_spaces)}):
{json.dumps(spaces_summary, indent=2, ensure_ascii=False)}

El usuario actual es: {user_name} ({current_user.email})

Reglas:
- Responde siempre en español
- Sé conciso pero informativo
- Si el usuario pregunta por un espacio específico, proporciona detalles completos
- Si no tienes información suficiente, indícalo claramente
- Sugiere opciones alternativas cuando sea apropiado
- IMPORTANTE: NO generes planos ASCII, diagramas de texto, ni representaciones visuales con caracteres. Si el usuario pregunta sobre distribución de espacios, recomiéndale usar el "Asistente IA" en el menú lateral donde hay herramientas gráficas especializadas para eso.
- Al final de tu respuesta, incluye 2-3 sugerencias de preguntas relacionadas

Contexto adicional del usuario: {chat_message.context or 'Ninguno'}
"""
        
        full_prompt = f"{system_context}\n\nPregunta del usuario: {chat_message.message}"
        
        # Generar respuesta (ejecutar en thread pool para async)
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            executor,
            lambda: model.generate_content(full_prompt)
        )
        
        if not response or not response.text:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo obtener respuesta del modelo de IA"
            )
        
        response_text = response.text
        
        # Extraer sugerencias del texto (si las incluyó)
        suggestions = []
        if "sugerencias" in response_text.lower() or "preguntas" in response_text.lower():
            # Intentar extraer las sugerencias
            lines = response_text.split('\n')
            for line in lines:
                if line.strip().startswith(('-', '•', '*', '1.', '2.', '3.')):
                    suggestion = line.strip().lstrip('-•*0123456789. ')
                    if len(suggestion) > 10 and '?' in suggestion:
                        suggestions.append(suggestion)
        
        # Si no encontró sugerencias, agregar unas genéricas
        if not suggestions:
            suggestions = [
                "¿Qué espacios tienen proyector disponible?",
                "¿Cuál es el espacio con mayor capacidad?",
                "¿Qué espacios están disponibles ahora?"
            ]
        
        # Buscar espacios mencionados en la respuesta
        spaces_mentioned = []
        for space in all_spaces:
            if space.nombre.lower() in response_text.lower():
                spaces_mentioned.append({
                    "id": space.id,
                    "nombre": space.nombre,
                    "tipo": space.tipo,
                    "disponible": space.estado == "disponible"
                })
        
        logger.info(f"Chat response generated for user {current_user.email}")
        
        return ChatResponse(
            response=response_text,
            suggestions=suggestions[:3],
            timestamp=datetime.utcnow().isoformat(),
            model_used="gemini-2.0-flash",
            spaces_mentioned=spaces_mentioned
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar el mensaje: {str(e)}"
        )


@router.post("/quick-search", summary="Búsqueda rápida de espacios con IA")
async def quick_search(
    query: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Búsqueda inteligente de espacios usando lenguaje natural.
    
    Ejemplos:
    - "Necesito un aula para 30 personas con proyector"
    - "Laboratorio disponible con computadores"
    - "Sala de conferencias para mañana"
    """
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de IA no configurado"
        )
    
    try:
        all_spaces = await SpaceCRUD.get_all(db)
        
        spaces_data = []
        for space in all_spaces:
            spaces_data.append({
                "id": space.id,
                "nombre": space.nombre,
                "tipo": space.tipo,
                "capacidad": space.capacidad,
                "ubicacion": space.ubicacion,
                "estado": space.estado,
                "disponible": space.estado == "disponible",
                "caracteristicas": space.caracteristicas if space.caracteristicas else []
            })
        
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")
        
        prompt = f"""Analiza la siguiente consulta de búsqueda y encuentra los espacios más relevantes.

Consulta del usuario: "{query}"

Espacios disponibles:
{json.dumps(spaces_data, indent=2, ensure_ascii=False)}

Responde ÚNICAMENTE con un JSON válido con esta estructura:
{{
    "matching_spaces": [
        {{
            "id": <id del espacio>,
            "nombre": "<nombre>",
            "relevance_score": <0.0-1.0>,
            "reason": "<razón de la recomendación>"
        }}
    ],
    "search_interpretation": "<cómo interpretaste la búsqueda>",
    "alternative_suggestions": ["<sugerencia1>", "<sugerencia2>"]
}}

Ordena por relevance_score descendente. Máximo 5 resultados."""

        # Ejecutar en thread pool para async
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            executor,
            lambda: model.generate_content(prompt)
        )
        
        if response and response.text:
            # Limpiar la respuesta de posibles marcadores de código
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            
            result = json.loads(text.strip())
            result["query"] = query
            result["total_spaces_searched"] = len(all_spaces)
            result["model_used"] = "gemini-2.0-flash"
            result["timestamp"] = datetime.utcnow().isoformat()
            return result
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo procesar la búsqueda"
        )
        
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing JSON response: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar la respuesta de IA"
        )
    except Exception as e:
        logger.error(f"Error en quick search: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en la búsqueda: {str(e)}"
        )


# ==================== RESERVA INTELIGENTE CON IA ====================

class SmartReservationRequest(BaseModel):
    """Solicitud de reserva inteligente usando descripción en lenguaje natural"""
    descripcion: str  # Ej: "Necesito un aula para 20 estudiantes con proyector para el lunes de 8 a 10am"
    fecha_preferida: Optional[str] = None  # Fecha en formato YYYY-MM-DD
    hora_inicio_preferida: Optional[str] = None  # Hora en formato HH:MM
    hora_fin_preferida: Optional[str] = None
    capacidad_minima: Optional[int] = None
    capacidad_maxima: Optional[int] = None  # Nuevo: límite máximo para optimizar uso
    equipamiento_requerido: Optional[List[str]] = []
    tipo_espacio_preferido: Optional[str] = None  # aula, laboratorio, auditorio, etc.
    crear_reserva: bool = True  # Si es True, crea la reserva automáticamente
    optimizar_capacidad: bool = True  # Nuevo: priorizar espacios con capacidad óptima


class SmartReservationResponse(BaseModel):
    """Respuesta de la reserva inteligente"""
    success: bool
    message: str
    espacio_seleccionado: Optional[dict] = None
    alternativas: List[dict] = []
    reserva_creada: Optional[dict] = None
    analisis_ia: str = ""
    razon_seleccion: str = ""
    eficiencia_uso: Optional[float] = None  # Porcentaje de uso óptimo de capacidad
    model_used: str = "gemini-2.0-flash"
    timestamp: str = ""


@router.post("/smart-reservation", response_model=SmartReservationResponse, summary="Reserva inteligente con IA")
async def create_smart_reservation(
    request: SmartReservationRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Analiza los requerimientos del usuario en lenguaje natural y:
    1. Encuentra el mejor espacio disponible que cumpla los criterios
    2. Crea automáticamente la reserva si se solicita
    3. Proporciona alternativas y explicación de la decisión
    
    Ejemplo de uso:
    - "Necesito un aula para 20 estudiantes con proyector para el lunes de 8 a 10am"
    - "Busco un laboratorio de informática con capacidad para 30 personas"
    - "Requiero un auditorio grande para una conferencia el viernes"
    """
    
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El servicio de IA no está configurado"
        )
    
    try:
        # 1. Obtener todos los espacios disponibles
        all_spaces = await SpaceCRUD.get_all(db, limit=200)
        available_spaces = [s for s in all_spaces if s.estado == "disponible"]
        
        if not available_spaces:
            return SmartReservationResponse(
                success=False,
                message="No hay espacios disponibles en este momento",
                timestamp=datetime.utcnow().isoformat()
            )
        
        # 2. Pre-filtrar espacios por capacidad si se especifica (optimización)
        capacidad_solicitada = request.capacidad_minima
        capacidad_max = request.capacidad_maxima
        
        # Si se solicita optimización de capacidad, filtrar espacios
        # Para evitar asignar un auditorio de 120 personas para una reunión de 20
        filtered_spaces = available_spaces
        if request.optimizar_capacidad and capacidad_solicitada:
            # Calcular rango óptimo: capacidad_min hasta 1.5x la capacidad (máximo desperdicio 50%)
            optimal_max = capacidad_max or int(capacidad_solicitada * 1.5)
            
            # Filtrar espacios que cumplan el rango óptimo
            optimal_spaces = [
                s for s in available_spaces 
                if s.capacidad >= capacidad_solicitada and s.capacidad <= optimal_max
            ]
            
            # Si no hay espacios óptimos, buscar los más cercanos a la capacidad
            if optimal_spaces:
                filtered_spaces = optimal_spaces
                logger.info(f"Espacios optimizados: {len(optimal_spaces)} de {len(available_spaces)}")
            else:
                # Ordenar por diferencia de capacidad para priorizar los más cercanos
                available_spaces.sort(key=lambda s: abs(s.capacidad - capacidad_solicitada) if s.capacidad >= capacidad_solicitada else float('inf'))
                filtered_spaces = available_spaces[:10]  # Tomar los 10 más cercanos
                logger.info(f"Sin espacios óptimos, usando los {len(filtered_spaces)} más cercanos")
        
        # 3. Preparar información de espacios para la IA
        spaces_info = []
        for space in filtered_spaces:
            features = space.caracteristicas if isinstance(space.caracteristicas, list) else []
            spaces_info.append({
                "id": space.id,
                "nombre": space.nombre,
                "tipo": space.tipo,
                "capacidad": space.capacidad,
                "ubicacion": space.ubicacion or "No especificada",
                "caracteristicas": features,
                "descripcion": space.descripcion or ""
            })
        
        # 3. Construir el prompt para la IA
        user_name = current_user.nombre_completo or current_user.username
        
        prompt = f"""Eres un asistente experto en gestión de espacios universitarios. Tu tarea es analizar los requerimientos del usuario y seleccionar el MEJOR espacio disponible, OPTIMIZANDO EL USO DE LA CAPACIDAD.

⚠️ REGLA CRÍTICA DE OPTIMIZACIÓN DE CAPACIDAD:
- NUNCA asignes un espacio con capacidad excesiva para el grupo solicitado
- Si el usuario necesita espacio para 20 personas, NO selecciones un auditorio de 120
- La capacidad del espacio debe ser al menos la solicitada pero NO más del 150% de lo necesario
- Prioriza espacios donde se use al menos el 60-90% de la capacidad
- Si un aula de 30 personas es ideal para 20 personas, prefiérela sobre una de 100

REQUERIMIENTOS DEL USUARIO:
"{request.descripcion}"

INFORMACIÓN ADICIONAL DEL USUARIO:
- Fecha preferida: {request.fecha_preferida or "No especificada"}
- Hora inicio: {request.hora_inicio_preferida or "No especificada"}
- Hora fin: {request.hora_fin_preferida or "No especificada"}
- Capacidad mínima solicitada: {request.capacidad_minima or "No especificada"}
- Capacidad máxima permitida: {request.capacidad_maxima or "No especificada (usar 1.5x mínima)"}
- Equipamiento requerido: {', '.join(request.equipamiento_requerido) if request.equipamiento_requerido else "No especificado"}
- Tipo de espacio preferido: {request.tipo_espacio_preferido or "No especificado"}

ESPACIOS DISPONIBLES (pre-filtrados por capacidad óptima):
{json.dumps(spaces_info, indent=2, ensure_ascii=False)}

INSTRUCCIONES:
1. Analiza cuidadosamente los requerimientos (extraer capacidad, equipos, tipo de espacio, etc.)
2. Compara con los espacios disponibles
3. Calcula la "eficiencia de uso" = (personas_necesarias / capacidad_espacio) * 100
4. PRIORIZA espacios con eficiencia entre 60% y 90%
5. Selecciona el MEJOR espacio que cumpla los criterios con mayor eficiencia
6. Si ninguno cumple perfectamente, selecciona el más cercano en capacidad
7. Sugiere 2-3 alternativas ordenadas por eficiencia

RESPONDE ÚNICAMENTE EN FORMATO JSON:
{{
    "espacio_seleccionado_id": <id del mejor espacio o null si no hay>,
    "puntuacion": <0.0-1.0 qué tan bien cumple los requisitos>,
    "eficiencia_uso": <porcentaje de uso de capacidad>,
    "razon_seleccion": "<explicación clara de por qué este espacio es el mejor, INCLUIR eficiencia de capacidad>",
    "requerimientos_extraidos": {{
        "capacidad_necesaria": <número o null>,
        "equipos_necesarios": ["equipo1", "equipo2"],
        "tipo_espacio": "<tipo deducido>",
        "fecha_solicitada": "<fecha si se menciona>",
        "hora_inicio": "<hora si se menciona>",
        "hora_fin": "<hora si se menciona>"
    }},
    "alternativas_ids": [<id1>, <id2>],
    "advertencias": ["advertencia1 si hay - INCLUIR advertencia si capacidad no es óptima"],
    "recomendaciones_adicionales": "<consejos para el usuario>"
}}"""

        # 4. Llamar a Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            executor,
            lambda: model.generate_content(prompt)
        )
        
        if not response or not response.text:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo obtener respuesta de la IA"
            )
        
        # 5. Parsear respuesta de la IA
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        
        ai_result = json.loads(text.strip())
        logger.info(f"Respuesta IA: {ai_result}")
        
        # 6. Obtener el espacio seleccionado
        selected_space = None
        selected_space_dict = None
        if ai_result.get("espacio_seleccionado_id"):
            for space in available_spaces:
                if space.id == ai_result["espacio_seleccionado_id"]:
                    selected_space = space
                    features = space.caracteristicas if isinstance(space.caracteristicas, list) else []
                    selected_space_dict = {
                        "id": space.id,
                        "nombre": space.nombre,
                        "tipo": space.tipo,
                        "capacidad": space.capacidad,
                        "ubicacion": space.ubicacion,
                        "caracteristicas": features,
                        "puntuacion": ai_result.get("puntuacion", 0.8)
                    }
                    break
        
        # 7. Obtener alternativas
        alternativas = []
        for alt_id in ai_result.get("alternativas_ids", []):
            for space in available_spaces:
                if space.id == alt_id:
                    features = space.caracteristicas if isinstance(space.caracteristicas, list) else []
                    alternativas.append({
                        "id": space.id,
                        "nombre": space.nombre,
                        "tipo": space.tipo,
                        "capacidad": space.capacidad,
                        "ubicacion": space.ubicacion,
                        "caracteristicas": features
                    })
                    break
        
        # 8. Crear la reserva si se solicita y hay un espacio seleccionado
        reserva_creada = None
        if request.crear_reserva and selected_space:
            from app.db.crud import AssignmentCRUD
            
            # Determinar fechas
            fecha_str = ai_result.get("requerimientos_extraidos", {}).get("fecha_solicitada") or request.fecha_preferida
            hora_inicio = ai_result.get("requerimientos_extraidos", {}).get("hora_inicio") or request.hora_inicio_preferida or "08:00"
            hora_fin = ai_result.get("requerimientos_extraidos", {}).get("hora_fin") or request.hora_fin_preferida or "10:00"
            
            # Usar fecha actual si no se especifica
            if fecha_str:
                try:
                    fecha_base = datetime.strptime(fecha_str, "%Y-%m-%d")
                except:
                    fecha_base = datetime.utcnow()
            else:
                fecha_base = datetime.utcnow()
            
            # Parsear horas
            try:
                hora_inicio_parts = hora_inicio.replace("am", "").replace("pm", "").replace("AM", "").replace("PM", "").strip().split(":")
                hora_inicio_h = int(hora_inicio_parts[0])
                hora_inicio_m = int(hora_inicio_parts[1]) if len(hora_inicio_parts) > 1 else 0
                if "pm" in hora_inicio.lower() and hora_inicio_h < 12:
                    hora_inicio_h += 12
                
                hora_fin_parts = hora_fin.replace("am", "").replace("pm", "").replace("AM", "").replace("PM", "").strip().split(":")
                hora_fin_h = int(hora_fin_parts[0])
                hora_fin_m = int(hora_fin_parts[1]) if len(hora_fin_parts) > 1 else 0
                if "pm" in hora_fin.lower() and hora_fin_h < 12:
                    hora_fin_h += 12
            except:
                hora_inicio_h, hora_inicio_m = 8, 0
                hora_fin_h, hora_fin_m = 10, 0
            
            fecha_inicio = fecha_base.replace(hour=hora_inicio_h, minute=hora_inicio_m, second=0, microsecond=0)
            fecha_fin_dt = fecha_base.replace(hour=hora_fin_h, minute=hora_fin_m, second=0, microsecond=0)
            
            # Crear la reserva/asignación
            assignment = await AssignmentCRUD.create(
                db,
                room_id=selected_space.id,
                resource_id=1,  # ID de recurso por defecto
                fecha=fecha_inicio,
                fecha_fin=fecha_fin_dt,
                estado="activo",
                notas=f"Reserva inteligente por IA para {user_name}: {request.descripcion[:200]}"
            )
            await db.commit()
            
            reserva_creada = {
                "id": assignment.id,
                "espacio_id": selected_space.id,
                "espacio_nombre": selected_space.nombre,
                "fecha_inicio": fecha_inicio.isoformat(),
                "fecha_fin": fecha_fin_dt.isoformat(),
                "estado": "activo",
                "creado_por": user_name
            }
            
            logger.info(f"Reserva creada: {reserva_creada}")
        
        # 9. Construir respuesta
        recomendaciones = ai_result.get("recomendaciones_adicionales", "")
        advertencias = ai_result.get("advertencias", [])
        eficiencia = ai_result.get("eficiencia_uso")
        
        analisis = f"Requerimientos identificados: {json.dumps(ai_result.get('requerimientos_extraidos', {}), ensure_ascii=False)}"
        if eficiencia:
            analisis += f"\n📊 Eficiencia de uso: {eficiencia}%"
        if advertencias:
            analisis += f"\n⚠️ Advertencias: {', '.join(advertencias)}"
        if recomendaciones:
            analisis += f"\n💡 Recomendaciones: {recomendaciones}"
        
        return SmartReservationResponse(
            success=selected_space is not None,
            message="Reserva creada exitosamente" if reserva_creada else (
                "Espacio encontrado" if selected_space else "No se encontró un espacio que cumpla los requisitos"
            ),
            espacio_seleccionado=selected_space_dict,
            alternativas=alternativas,
            reserva_creada=reserva_creada,
            analisis_ia=analisis,
            razon_seleccion=ai_result.get("razon_seleccion", ""),
            eficiencia_uso=eficiencia,
            model_used=GEMINI_MODEL,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing AI response: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar la respuesta de IA"
        )
    except Exception as e:
        logger.error(f"Error en smart reservation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar la solicitud: {str(e)}"
        )


# ==================== OPTIMIZACIÓN DE ESPACIOS CON IA ====================

class OptimizationSuggestionsResponse(BaseModel):
    """Respuesta de sugerencias de optimización generadas por IA"""
    success: bool
    suggestions: List[str]
    detailed_analysis: List[dict] = []
    optimization_score: float = 0.0
    estimated_improvement: float = 0.0
    model_used: str = "gemini-2.0-flash"
    timestamp: str = ""


@router.get("/optimize-suggestions", response_model=OptimizationSuggestionsResponse, summary="Obtener sugerencias de optimización con IA")
async def get_optimization_suggestions(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Genera sugerencias inteligentes de optimización usando IA.
    
    Analiza todos los espacios, su uso actual y genera recomendaciones
    personalizadas para mejorar la eficiencia del sistema.
    """
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de IA no configurado"
        )
    
    try:
        # Obtener todos los espacios y asignaciones
        all_spaces = await SpaceCRUD.get_all(db, limit=200)
        
        from app.db.crud import AssignmentCRUD
        active_assignments = await AssignmentCRUD.get_active(db)
        
        # Preparar datos de espacios
        spaces_info = []
        spaces_with_assignments = set()
        
        for assignment in active_assignments:
            spaces_with_assignments.add(assignment.space_id)
        
        type_counts = {}
        total_capacity = 0
        occupied_count = 0
        
        for space in all_spaces:
            tipo = space.tipo or "Sin tipo"
            type_counts[tipo] = type_counts.get(tipo, 0) + 1
            total_capacity += space.capacidad or 0
            
            is_assigned = space.id in spaces_with_assignments
            if is_assigned or space.estado != "disponible":
                occupied_count += 1
            
            features = space.caracteristicas if isinstance(space.caracteristicas, list) else []
            spaces_info.append({
                "id": space.id,
                "nombre": space.nombre,
                "tipo": tipo,
                "capacidad": space.capacidad,
                "estado": space.estado,
                "en_uso": is_assigned,
                "caracteristicas": features,
                "ubicacion": space.ubicacion or "No especificada"
            })
        
        # Calcular métricas
        total_spaces = len(all_spaces)
        utilization_rate = (occupied_count / total_spaces * 100) if total_spaces > 0 else 0
        avg_capacity = (total_capacity / total_spaces) if total_spaces > 0 else 0
        
        # Crear prompt para la IA
        prompt = f"""Eres un experto en optimización de espacios físicos universitarios. Analiza los siguientes datos y genera recomendaciones de optimización específicas y accionables.

ESTADÍSTICAS GENERALES:
- Total de espacios: {total_spaces}
- Espacios ocupados/en uso: {occupied_count}
- Tasa de utilización: {utilization_rate:.1f}%
- Capacidad total: {total_capacity} personas
- Capacidad promedio por espacio: {avg_capacity:.0f} personas

DISTRIBUCIÓN POR TIPO:
{json.dumps(type_counts, indent=2, ensure_ascii=False)}

DETALLES DE LOS ESPACIOS (muestra):
{json.dumps(spaces_info[:30], indent=2, ensure_ascii=False)}

INSTRUCCIONES:
Genera un análisis de optimización con sugerencias ESPECÍFICAS basadas en los datos reales.

RESPONDE ÚNICAMENTE EN FORMATO JSON:
{{
    "suggestions": [
        "Sugerencia específica 1 con datos concretos del análisis",
        "Sugerencia específica 2 basada en los espacios analizados",
        "Sugerencia específica 3 con acciones concretas",
        "Sugerencia específica 4 para mejorar la eficiencia",
        "Sugerencia específica 5 con recomendaciones de uso"
    ],
    "detailed_analysis": [
        {{
            "area": "Utilización de espacios",
            "finding": "hallazgo específico",
            "recommendation": "recomendación detallada",
            "priority": "alta/media/baja",
            "potential_impact": "impacto estimado"
        }},
        {{
            "area": "Distribución por tipo",
            "finding": "hallazgo específico",
            "recommendation": "recomendación detallada",
            "priority": "alta/media/baja",
            "potential_impact": "impacto estimado"
        }}
    ],
    "optimization_score": <0.0-1.0 puntuación actual del sistema>,
    "estimated_improvement": <porcentaje de mejora estimado si se siguen las recomendaciones>
}}

Las sugerencias deben ser en español, específicas, accionables y basadas en los datos proporcionados."""

        # Llamar a Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            executor,
            lambda: model.generate_content(prompt)
        )
        
        if not response or not response.text:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo obtener respuesta de la IA"
            )
        
        # Parsear respuesta
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        
        ai_result = json.loads(text.strip())
        logger.info(f"Respuesta de optimización IA: {ai_result}")
        
        return OptimizationSuggestionsResponse(
            success=True,
            suggestions=ai_result.get("suggestions", []),
            detailed_analysis=ai_result.get("detailed_analysis", []),
            optimization_score=ai_result.get("optimization_score", utilization_rate / 100),
            estimated_improvement=ai_result.get("estimated_improvement", 15.0),
            model_used=GEMINI_MODEL,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing AI optimization response: {e}")
        # Retornar sugerencias básicas basadas en métricas
        basic_suggestions = []
        if occupied_count < total_spaces * 0.5:
            basic_suggestions.append(f"La tasa de utilización actual es del {utilization_rate:.1f}%. Considere promover los espacios disponibles.")
        basic_suggestions.append(f"Hay {total_spaces - occupied_count} espacios disponibles que podrían asignarse.")
        
        return OptimizationSuggestionsResponse(
            success=True,
            suggestions=basic_suggestions,
            optimization_score=utilization_rate / 100,
            estimated_improvement=10.0,
            model_used=GEMINI_MODEL,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error en optimize-suggestions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar la optimización: {str(e)}"
        )


# ==================== ANÁLISIS DE DISTRIBUCIÓN DE ESPACIOS CON IA ====================

class SpaceLayoutRequest(BaseModel):
    """Solicitud de análisis de distribución de espacio"""
    tipo_espacio: str  # aula, laboratorio, parqueadero, auditorio, oficina, etc.
    metros_cuadrados: float
    forma: Optional[str] = "rectangular"  # rectangular, cuadrado, irregular, L
    largo: Optional[float] = None  # metros
    ancho: Optional[float] = None  # metros
    
    # Elementos requeridos
    elementos: List[dict] = []  # [{"tipo": "computador", "cantidad": 40}, {"tipo": "silla", "cantidad": 40}]
    
    # Requerimientos adicionales
    incluir_espacio_instructor: bool = True
    incluir_pasillos: bool = True
    ancho_pasillo_minimo: Optional[float] = 1.2  # metros
    
    # Para parqueaderos
    espacios_vehiculos: Optional[int] = None
    espacios_motos: Optional[int] = None
    espacios_discapacitados: Optional[int] = None
    
    # Restricciones
    ventanas_en: Optional[str] = None  # norte, sur, este, oeste
    puerta_en: Optional[str] = None
    restricciones_adicionales: Optional[str] = None


class ElementoDistribucion(BaseModel):
    """Elemento individual en la distribución"""
    tipo: str
    cantidad: int
    area_unitaria: float  # m² por unidad
    area_total: float  # m² total
    disposicion_sugerida: str
    filas: Optional[int] = None
    columnas: Optional[int] = None


class SpaceLayoutResponse(BaseModel):
    """Respuesta del análisis de distribución"""
    es_viable: bool
    mensaje: str
    
    # Análisis de espacio
    area_total: float
    area_utilizable: float  # después de pasillos y espacios de circulación
    area_requerida: float
    porcentaje_ocupacion: float
    
    # Distribución sugerida
    distribucion_elementos: List[dict] = []
    
    # Dimensiones sugeridas
    dimensiones_sugeridas: Optional[dict] = None
    
    # Recomendaciones
    recomendaciones: List[str] = []
    advertencias: List[str] = []
    
    # Alternativas si no es viable
    alternativas: List[dict] = []
    
    # Dimensiones del espacio
    dimensiones: Optional[dict] = None
    
    # Metadata
    model_used: str = "gemini-2.0-flash"
    timestamp: str = ""


# Constantes de referencia para cálculos de espacio
# IMPORTANTE: 
# - PC/Computador: YA INCLUYE escritorio y silla (estación de trabajo completa)
# - Pupitre: YA INCLUYE mesa y silla (todo en uno)
# - Proyector: Va en el TECHO, no ocupa espacio en el suelo
# - Pantalla/Pizarra: Va en la PARED, espacio frontal mínimo para visibilidad
ESPACIO_REFERENCIA = {
    # Estación de trabajo completa (PC + escritorio + silla + espacio circulación)
    "computador": {"area": 2.5, "min_separacion": 0.8, "incluye": ["escritorio", "silla"], "descripcion": "Estación completa con escritorio y silla"},
    "pc": {"area": 2.5, "min_separacion": 0.8, "incluye": ["escritorio", "silla"], "descripcion": "Estación completa con escritorio y silla"},
    
    # Mobiliario educativo individual
    "pupitre": {"area": 1.0, "min_separacion": 0.5, "incluye": ["mesa", "silla"], "descripcion": "Pupitre unipersonal (mesa+silla integradas)"},
    "silla": {"area": 0.5, "min_separacion": 0.3, "descripcion": "Silla individual sin mesa"},
    "escritorio_estudiante": {"area": 1.2, "min_separacion": 0.5, "descripcion": "Mesa individual sin silla"},
    "mesa_trabajo": {"area": 2.0, "min_separacion": 0.6, "descripcion": "Mesa de trabajo compartida"},
    
    # Equipo audiovisual (mayoría NO ocupa espacio en suelo)
    "proyector": {"area": 0.0, "min_separacion": 0, "ubicacion": "techo", "descripcion": "Proyector en techo - no ocupa suelo"},
    "pantalla": {"area": 0.5, "min_separacion": 2.0, "ubicacion": "pared", "descripcion": "Pantalla en pared - espacio frontal para visibilidad"},
    "televisor": {"area": 0.3, "min_separacion": 1.5, "ubicacion": "pared", "descripcion": "TV en pared o soporte"},
    "video_beam": {"area": 0.0, "min_separacion": 0, "ubicacion": "techo", "descripcion": "Video beam en techo"},
    
    # Espacio instructor/docente
    "escritorio_profesor": {"area": 2.5, "min_separacion": 1.0, "descripcion": "Escritorio docente con silla"},
    "pizarra": {"area": 0.0, "min_separacion": 2.5, "ubicacion": "pared", "descripcion": "Pizarra en pared - requiere espacio frontal"},
    
    # Laboratorio
    "mesa_laboratorio": {"area": 3.5, "min_separacion": 1.0, "descripcion": "Mesa de laboratorio para 2 personas"},
    "equipo_laboratorio": {"area": 1.5, "min_separacion": 0.8, "descripcion": "Equipo de laboratorio en mesa"},
    
    # Estacionamiento (m² por espacio - dimensiones reales)
    "vehiculo": {"area": 11.25, "min_separacion": 0.6, "descripcion": "Espacio vehicular estándar 2.5m x 4.5m"},
    "motocicleta": {"area": 1.4, "min_separacion": 0.3, "descripcion": "Espacio moto 0.7m x 2m"},
    "vehiculo_discapacitado": {"area": 15.75, "min_separacion": 0.6, "descripcion": "Espacio PMR 3.5m x 4.5m"},
    
    # Oficina
    "escritorio_oficina": {"area": 3.5, "min_separacion": 0.8, "descripcion": "Puesto de trabajo oficina completo"},
    "archivador": {"area": 0.6, "min_separacion": 0.5, "descripcion": "Archivador vertical"},
    
    # Auditorio/Sala de eventos
    "butaca": {"area": 0.6, "min_separacion": 0.1, "descripcion": "Butaca fija de auditorio"},
    "silla_plegable": {"area": 0.5, "min_separacion": 0.2, "descripcion": "Silla plegable para eventos"},
}


@router.post("/analyze-space-layout", response_model=SpaceLayoutResponse, summary="Analizar distribución de espacio")
async def analyze_space_layout(
    request: SpaceLayoutRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Analiza la viabilidad y distribución óptima de elementos en un espacio físico.
    
    Casos de uso:
    - Aulas/Laboratorios: Determinar si caben X computadores/estudiantes
    - Parqueaderos: Distribuir espacios para vehículos y motos
    - Auditorios: Calcular capacidad de asientos
    - Oficinas: Optimizar distribución de escritorios
    
    Ejemplo: "90 m² para 40 computadores con espacio de profesor"
    """
    
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de IA no configurado"
        )
    
    try:
        # 1. Calcular área utilizable (descontando pasillos y circulación)
        area_total = request.metros_cuadrados
        
        # Factor de utilización según tipo de espacio
        factores_utilizacion = {
            "aula": 0.70,  # 70% utilizable, 30% pasillos/circulación
            "laboratorio": 0.65,
            "parqueadero": 0.75,  # Incluye carriles de circulación
            "auditorio": 0.80,
            "oficina": 0.65,
            "sala_conferencias": 0.75,
        }
        
        factor = factores_utilizacion.get(request.tipo_espacio.lower(), 0.70)
        area_utilizable = area_total * factor
        
        # 2. Calcular área requerida por elementos
        area_requerida = 0
        elementos_detalle = []
        
        for elemento in request.elementos:
            tipo = elemento.get("tipo", "").lower()
            cantidad = elemento.get("cantidad", 0)
            
            if tipo in ESPACIO_REFERENCIA:
                area_unitaria = ESPACIO_REFERENCIA[tipo]["area"]
            else:
                # Área por defecto si no está en referencia
                area_unitaria = 2.0
            
            area_elemento = area_unitaria * cantidad
            area_requerida += area_elemento
            
            elementos_detalle.append({
                "tipo": tipo,
                "cantidad": cantidad,
                "area_unitaria": area_unitaria,
                "area_total": area_elemento
            })
        
        # Agregar espacio del instructor si aplica
        if request.incluir_espacio_instructor and request.tipo_espacio.lower() in ["aula", "laboratorio", "sala_conferencias"]:
            area_instructor = 8.0  # Escritorio + espacio movimiento + pizarra
            area_requerida += area_instructor
            elementos_detalle.append({
                "tipo": "espacio_instructor",
                "cantidad": 1,
                "area_unitaria": area_instructor,
                "area_total": area_instructor
            })
        
        # Para parqueaderos
        if request.tipo_espacio.lower() == "parqueadero":
            if request.espacios_vehiculos:
                area_vehiculos = request.espacios_vehiculos * ESPACIO_REFERENCIA["vehiculo"]["area"]
                area_requerida += area_vehiculos
                elementos_detalle.append({
                    "tipo": "espacio_vehiculo",
                    "cantidad": request.espacios_vehiculos,
                    "area_unitaria": ESPACIO_REFERENCIA["vehiculo"]["area"],
                    "area_total": area_vehiculos
                })
            
            if request.espacios_motos:
                area_motos = request.espacios_motos * ESPACIO_REFERENCIA["motocicleta"]["area"]
                area_requerida += area_motos
                elementos_detalle.append({
                    "tipo": "espacio_motocicleta",
                    "cantidad": request.espacios_motos,
                    "area_unitaria": ESPACIO_REFERENCIA["motocicleta"]["area"],
                    "area_total": area_motos
                })
            
            if request.espacios_discapacitados:
                area_disc = request.espacios_discapacitados * ESPACIO_REFERENCIA["vehiculo_discapacitado"]["area"]
                area_requerida += area_disc
                elementos_detalle.append({
                    "tipo": "espacio_discapacitado",
                    "cantidad": request.espacios_discapacitados,
                    "area_unitaria": ESPACIO_REFERENCIA["vehiculo_discapacitado"]["area"],
                    "area_total": area_disc
                })
        
        # 3. Determinar viabilidad inicial
        es_viable = area_requerida <= area_utilizable
        porcentaje_ocupacion = (area_requerida / area_utilizable * 100) if area_utilizable > 0 else 0
        
        # 4. Construir prompt para Gemini
        prompt = f"""Eres un arquitecto experto en diseño de espacios y distribución de mobiliario. Analiza la siguiente solicitud de distribución de espacio.

DATOS DEL ESPACIO:
- Tipo: {request.tipo_espacio}
- Área total: {area_total} m²
- Área utilizable (después de pasillos): {area_utilizable:.1f} m²
- Forma: {request.forma}
{f"- Dimensiones: {request.largo}m x {request.ancho}m" if request.largo and request.ancho else ""}

ELEMENTOS A DISTRIBUIR:
{json.dumps(elementos_detalle, indent=2, ensure_ascii=False)}

ÁREA REQUERIDA CALCULADA: {area_requerida:.1f} m²
ES VIABLE INICIALMENTE: {"Sí" if es_viable else "No"}
PORCENTAJE DE OCUPACIÓN: {porcentaje_ocupacion:.1f}%

REQUERIMIENTOS ADICIONALES:
- Incluir espacio instructor: {request.incluir_espacio_instructor}
- Ancho mínimo de pasillo: {request.ancho_pasillo_minimo}m
{f"- Ventanas en: {request.ventanas_en}" if request.ventanas_en else ""}
{f"- Puerta en: {request.puerta_en}" if request.puerta_en else ""}
{f"- Restricciones: {request.restricciones_adicionales}" if request.restricciones_adicionales else ""}

INSTRUCCIONES:
1. Analiza si la distribución es viable considerando ergonomía y normativas
2. Si ES VIABLE: Proporciona la distribución óptima con filas/columnas
3. Si NO ES VIABLE: Sugiere alternativas (reducir cantidad, ampliar espacio, etc.)
4. Genera un plano ASCII simple mostrando la distribución
5. Da recomendaciones específicas para este tipo de espacio

RESPONDE ÚNICAMENTE EN FORMATO JSON:
{{
    "es_viable": true/false,
    "viabilidad_detalle": "explicación detallada de por qué es o no viable",
    "distribucion_optima": [
        {{
            "elemento": "nombre del elemento",
            "cantidad": número,
            "disposicion": "descripción (ej: 5 filas x 8 columnas)",
            "filas": número,
            "columnas": número,
            "orientacion": "hacia pizarra/norte/etc",
            "separacion_recomendada": "distancia en metros"
        }}
    ],
    "dimensiones_sugeridas": {{
        "largo_optimo": metros,
        "ancho_optimo": metros,
        "altura_recomendada": metros
    }},
    "recomendaciones": [
        "recomendación específica 1",
        "recomendación específica 2"
    ],
    "advertencias": [
        "advertencia si hay problemas potenciales"
    ],
    "alternativas_si_no_viable": [
        {{
            "opcion": "descripción de alternativa",
            "elementos_reducidos": {{"tipo": cantidad}},
            "area_necesaria": metros,
            "beneficios": "por qué esta alternativa es buena"
        }}
    ],
    "normativas_consideradas": ["normativa 1", "normativa 2"],
    "capacidad_maxima_recomendada": número
}}

IMPORTANTE: NO generes planos ASCII ni representaciones visuales de texto. El sistema tiene visualización gráfica."""

        # 5. Llamar a Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            executor,
            lambda: model.generate_content(prompt)
        )
        
        if not response or not response.text:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo obtener respuesta de la IA"
            )
        
        # 6. Parsear respuesta
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        
        ai_result = json.loads(text.strip())
        logger.info(f"Respuesta de análisis de espacio IA: {ai_result}")
        
        # 7. Construir respuesta
        return SpaceLayoutResponse(
            es_viable=ai_result.get("es_viable", es_viable),
            mensaje=ai_result.get("viabilidad_detalle", 
                "Espacio viable para la distribución solicitada" if es_viable else 
                "El espacio no es suficiente para los elementos solicitados"),
            area_total=area_total,
            area_utilizable=area_utilizable,
            area_requerida=area_requerida,
            porcentaje_ocupacion=porcentaje_ocupacion,
            distribucion_elementos=ai_result.get("distribucion_optima", elementos_detalle),
            dimensiones_sugeridas=ai_result.get("dimensiones_sugeridas"),
            dimensiones={"largo": request.largo or math.sqrt(area_total * 1.5), "ancho": request.ancho or math.sqrt(area_total / 1.5)},
            recomendaciones=ai_result.get("recomendaciones", []),
            advertencias=ai_result.get("advertencias", []),
            alternativas=ai_result.get("alternativas_si_no_viable", []),
            model_used=GEMINI_MODEL,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing AI space layout response: {e}")
        
        # Respuesta básica sin IA
        return SpaceLayoutResponse(
            es_viable=es_viable,
            mensaje=f"Análisis básico: {'El espacio es suficiente' if es_viable else 'El espacio NO es suficiente'}. Se requieren {area_requerida:.1f} m² y hay {area_utilizable:.1f} m² disponibles.",
            area_total=area_total,
            area_utilizable=area_utilizable,
            area_requerida=area_requerida,
            porcentaje_ocupacion=porcentaje_ocupacion,
            distribucion_elementos=elementos_detalle,
            recomendaciones=[
                f"Ocupación del {porcentaje_ocupacion:.1f}% del espacio utilizable",
                "Se recomienda mantener la ocupación por debajo del 85% para comodidad"
            ] if es_viable else [
                f"Reducir la cantidad de elementos en aproximadamente {((area_requerida - area_utilizable) / area_requerida * 100):.0f}%",
                f"O aumentar el área a mínimo {area_requerida / factor:.0f} m²"
            ],
            advertencias=[] if es_viable else [
                f"Faltan {area_requerida - area_utilizable:.1f} m² para la distribución solicitada"
            ],
            model_used=GEMINI_MODEL,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error en analyze-space-layout: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al analizar la distribución: {str(e)}"
        )


@router.get("/space-reference-data", summary="Obtener datos de referencia de espacios")
async def get_space_reference_data(
    current_user = Depends(get_current_active_user)
):
    """
    Retorna los datos de referencia para cálculos de espacio.
    Útil para que el frontend muestre información de ayuda al usuario.
    """
    return {
        "elementos_referencia": ESPACIO_REFERENCIA,
        "tipos_espacio": [
            {"id": "aula", "nombre": "Aula de clases", "factor_utilizacion": 0.70},
            {"id": "laboratorio", "nombre": "Laboratorio de cómputo", "factor_utilizacion": 0.65},
            {"id": "parqueadero", "nombre": "Parqueadero", "factor_utilizacion": 0.75},
            {"id": "auditorio", "nombre": "Auditorio", "factor_utilizacion": 0.80},
            {"id": "oficina", "nombre": "Oficina", "factor_utilizacion": 0.65},
            {"id": "sala_conferencias", "nombre": "Sala de conferencias", "factor_utilizacion": 0.75},
        ],
        "normativas": {
            "aula": {
                "m2_por_estudiante_minimo": 1.5,
                "ancho_pasillo_minimo": 1.2,
                "distancia_pizarra_primera_fila": 2.0
            },
            "laboratorio": {
                "m2_por_puesto_minimo": 2.0,
                "separacion_equipos": 0.8,
                "ventilacion_requerida": True
            },
            "parqueadero": {
                "ancho_vehiculo_estandar": 2.5,
                "largo_vehiculo_estandar": 5.0,
                "ancho_discapacitado": 3.6,
                "ancho_carril_circulacion": 6.0
            }
        }
    }


# ==================== PROGRAMADOR DE CLASES CON IA ====================

@router.post("/schedule-classes", response_model=ScheduleClassesResponse, summary="Programar múltiples clases con IA")
async def schedule_classes(
    request: ScheduleClassesRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Programa múltiples clases/materias de diferentes semestres optimizando:
    1. Evitar conflictos de horarios entre materias del mismo semestre
    2. Evitar asignar el mismo espacio a dos clases al mismo tiempo
    3. Asignar espacios con capacidad adecuada
    4. Considerar equipamiento requerido
    
    Útil para:
    - Programación semestral de clases universitarias
    - Gestión de múltiples materias con diferentes requisitos
    - Evitar cruces de horarios entre materias del mismo semestre
    """
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de IA no configurado. Contacte al administrador."
        )
    
    if not request.materias:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe proporcionar al menos una materia para programar"
        )
    
    try:
        # Obtener espacios disponibles
        all_spaces = await SpaceCRUD.get_all(db)
        
        # Filtrar espacios por tipo y disponibilidad
        espacios_disponibles = []
        for space in all_spaces:
            if space.estado == "disponible":
                espacios_disponibles.append({
                    "id": space.id,
                    "nombre": space.nombre,
                    "tipo": space.tipo,
                    "capacidad": space.capacidad,
                    "ubicacion": space.ubicacion,
                    "caracteristicas": space.caracteristicas if space.caracteristicas else []
                })
        
        # Preparar datos de materias para el prompt
        materias_data = []
        for m in request.materias:
            materias_data.append({
                "id": m.id,
                "materia": m.materia,
                "semestre": m.semestre,
                "estudiantes": m.estudiantes,
                "tipo_espacio": m.tipo_espacio,
                "dias": m.dias,
                "hora_inicio": m.hora_inicio,
                "hora_fin": m.hora_fin,
                "duracion_minutos": m.duracion,
                "equipamiento_requerido": m.equipamiento
            })
        
        # Agrupar materias por semestre para análisis de conflictos
        materias_por_semestre = {}
        for m in materias_data:
            sem = m["semestre"]
            if sem not in materias_por_semestre:
                materias_por_semestre[sem] = []
            materias_por_semestre[sem].append(m["materia"])
        
        # Configurar Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        prompt = f"""Eres un sistema experto en programación académica. Tu tarea es asignar espacios físicos a las siguientes materias evitando cualquier conflicto.

MATERIAS A PROGRAMAR:
{json.dumps(materias_data, indent=2, ensure_ascii=False)}

ESPACIOS DISPONIBLES:
{json.dumps(espacios_disponibles, indent=2, ensure_ascii=False)}

PERÍODO ACADÉMICO:
- Fecha inicio: {request.fecha_inicio}
- Fecha fin: {request.fecha_fin}

MATERIAS POR SEMESTRE (para validar conflictos):
{json.dumps(materias_por_semestre, indent=2, ensure_ascii=False)}

REGLAS CRÍTICAS:
1. Las materias del MISMO SEMESTRE NO pueden tener el mismo horario (los estudiantes no pueden estar en dos clases a la vez)
2. El MISMO ESPACIO no puede ser asignado a dos clases en el mismo día y hora
3. La CAPACIDAD del espacio debe ser >= número de estudiantes de la materia
4. Preferir espacios con el EQUIPAMIENTO requerido
5. Optimizar el uso de espacios (no usar aulas de 100 para 20 estudiantes si hay alternativas)

{f"PREFERENCIAS ADICIONALES: {request.preferencias_adicionales}" if request.preferencias_adicionales else ""}

RESPONDE ÚNICAMENTE CON UN JSON VÁLIDO con esta estructura exacta:
{{
    "success": true/false,
    "mensaje": "Resumen de la programación",
    "clases_programadas": [
        {{
            "materia_id": "id de la materia",
            "materia": "nombre de la materia",
            "semestre": "semestre",
            "espacio_asignado": "nombre del espacio",
            "espacio_id": id_numerico_o_null,
            "dia": "Lunes/Martes/etc",
            "hora_inicio": "08:00",
            "hora_fin": "10:00",
            "capacidad_espacio": 40,
            "estudiantes": 25,
            "equipamiento_disponible": ["proyector", "computadores"],
            "notas": "observaciones opcionales"
        }}
    ],
    "conflictos": [
        {{
            "tipo": "horario/espacio/capacidad",
            "descripcion": "Descripción del conflicto",
            "materias_afectadas": ["Materia1", "Materia2"],
            "sugerencia": "Cómo resolver el conflicto"
        }}
    ],
    "espacios_utilizados": [
        {{
            "espacio_id": 1,
            "nombre": "Nombre",
            "horas_semanales": 10,
            "materias_asignadas": 3
        }}
    ],
    "resumen": {{
        "total_materias": 5,
        "materias_programadas": 5,
        "materias_con_conflicto": 0,
        "espacios_usados": 3,
        "eficiencia_uso_espacios": 85.5
    }},
    "recomendaciones": [
        "Recomendación 1",
        "Recomendación 2"
    ],
    "horario_generado": {{
        "Lunes": {{
            "08:00-10:00": [{{"materia": "X", "espacio": "Y", "semestre": "Z"}}],
            "10:00-12:00": [{{"materia": "A", "espacio": "B", "semestre": "C"}}]
        }},
        "Martes": {{ ... }}
    }}
}}

Si hay conflictos que no puedes resolver, márcalos claramente pero intenta programar las demás materias.
Si no hay suficientes espacios, indica cuáles materias no pudieron ser programadas y por qué."""

        # Ejecutar en thread pool para async
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            executor,
            lambda: model.generate_content(prompt)
        )
        
        if not response or not response.text:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo obtener respuesta del modelo de IA"
            )
        
        # Limpiar respuesta
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        
        ai_result = json.loads(text.strip())
        logger.info(f"Programación de clases generada: {len(ai_result.get('clases_programadas', []))} clases")
        
        # Construir respuesta
        return ScheduleClassesResponse(
            success=ai_result.get("success", False),
            mensaje=ai_result.get("mensaje", "Programación completada"),
            clases_programadas=[
                ScheduledClass(**clase) for clase in ai_result.get("clases_programadas", [])
            ],
            conflictos=[
                ScheduleConflict(**conf) for conf in ai_result.get("conflictos", [])
            ],
            espacios_utilizados=ai_result.get("espacios_utilizados", []),
            resumen=ai_result.get("resumen", {}),
            recomendaciones=ai_result.get("recomendaciones", []),
            horario_generado=ai_result.get("horario_generado"),
            model_used=GEMINI_MODEL,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing AI schedule response: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar la respuesta de IA. Intente nuevamente."
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en schedule-classes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al programar clases: {str(e)}"
        )


# ==================== GENERADOR DE HORARIOS ACADÉMICOS ====================

class MateriaInput(BaseModel):
    """Entrada de una materia desde el frontend"""
    nombre_materia: str
    semestre: str
    programa: str
    docente: Optional[str] = ""
    numero_estudiantes: int
    horas_semanales: int
    tipo_espacio: str  # aula, laboratorio, auditorio
    equipamiento_requerido: List[str] = []
    dias_preferidos: List[str] = []  # ['monday', 'wednesday', 'friday']
    hora_inicio_preferida: str = "07:00"
    hora_fin_preferida: str = "19:00"


class GenerateScheduleRequest(BaseModel):
    """Solicitud para generar horario académico"""
    periodo_academico: str  # Ej: "2024-1"
    fecha_inicio: str  # YYYY-MM-DD
    fecha_fin: str  # YYYY-MM-DD
    materias: List[MateriaInput]
    evitar_cruces: bool = True
    optimizar_uso_espacios: bool = True


class HorarioItem(BaseModel):
    """Una clase asignada en el horario - formato esperado por frontend"""
    materia: str
    semestre: str
    programa: str
    docente: str
    dia: str
    hora_inicio: str
    hora_fin: str
    espacio: str  # Frontend espera 'espacio' no 'espacio_asignado'
    espacio_id: Optional[int] = None
    capacidad_espacio: Optional[int] = None
    estudiantes: Optional[int] = None
    equipamiento: List[str] = []


class GenerateScheduleResponse(BaseModel):
    """Respuesta del generador de horarios - formato esperado por frontend"""
    success: bool
    message: str  # Frontend espera 'message' no 'mensaje'
    horarios: List[HorarioItem] = []  # Frontend espera 'horarios' no 'horario'
    conflictos: List[str] = []  # Frontend espera lista de strings
    estadisticas: dict = {}  # Frontend espera 'estadisticas' no 'resumen'
    horario_por_dia: dict = {}
    horario_por_semestre: dict = {}
    espacios_asignados: List[dict] = []
    recomendaciones: List[str] = []
    model_used: str = "gemini-2.0-flash"
    timestamp: str = ""


@router.post("/generate-schedule", response_model=GenerateScheduleResponse, summary="Generar horario académico con IA")
async def generate_schedule(
    request: GenerateScheduleRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Genera un horario académico óptimo para múltiples materias.
    
    La IA se encarga de:
    1. Asignar espacios adecuados según capacidad y tipo
    2. Evitar cruces de horarios entre materias del mismo semestre
    3. Evitar asignar el mismo espacio a dos clases simultáneas
    4. Considerar el equipamiento requerido
    5. Optimizar el uso de los espacios disponibles
    
    Ideal para:
    - Programación semestral de clases universitarias
    - Coordinación de múltiples programas académicos
    - Gestión eficiente de espacios compartidos
    """
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de IA no configurado. Contacte al administrador."
        )
    
    if not request.materias:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe proporcionar al menos una materia para generar el horario"
        )
    
    try:
        # Obtener espacios disponibles de la base de datos
        all_spaces = await SpaceCRUD.get_all(db)
        
        # Filtrar espacios disponibles
        espacios_disponibles = []
        for space in all_spaces:
            if space.estado == "disponible":
                espacios_disponibles.append({
                    "id": space.id,
                    "nombre": space.nombre,
                    "tipo": space.tipo.lower() if space.tipo else "aula",
                    "capacidad": space.capacidad or 30,
                    "ubicacion": space.ubicacion or "",
                    "caracteristicas": space.caracteristicas if space.caracteristicas else []
                })
        
        # Si no hay espacios en BD, crear espacios ficticios para demostración
        if not espacios_disponibles:
            espacios_disponibles = [
                {"id": 1, "nombre": "Aula 101", "tipo": "aula", "capacidad": 40, "ubicacion": "Edificio A", "caracteristicas": ["Video Beam", "Aire Acondicionado"]},
                {"id": 2, "nombre": "Aula 102", "tipo": "aula", "capacidad": 35, "ubicacion": "Edificio A", "caracteristicas": ["Video Beam", "Pizarra Blanca"]},
                {"id": 3, "nombre": "Aula 201", "tipo": "aula", "capacidad": 50, "ubicacion": "Edificio B", "caracteristicas": ["Video Beam", "Aire Acondicionado", "Sonido"]},
                {"id": 4, "nombre": "Aula 202", "tipo": "aula", "capacidad": 45, "ubicacion": "Edificio B", "caracteristicas": ["Video Beam"]},
                {"id": 5, "nombre": "Lab. Informática 1", "tipo": "laboratorio", "capacidad": 30, "ubicacion": "Edificio C", "caracteristicas": ["Ordenador", "Laboratorio Informática", "Aire Acondicionado"]},
                {"id": 6, "nombre": "Lab. Informática 2", "tipo": "laboratorio", "capacidad": 25, "ubicacion": "Edificio C", "caracteristicas": ["Ordenador", "Laboratorio Informática"]},
                {"id": 7, "nombre": "Auditorio Principal", "tipo": "auditorio", "capacidad": 150, "ubicacion": "Edificio Central", "caracteristicas": ["Video Beam", "Sonido", "Aire Acondicionado", "Butacas"]},
                {"id": 8, "nombre": "Sala Conferencias", "tipo": "sala_conferencias", "capacidad": 60, "ubicacion": "Edificio A", "caracteristicas": ["Video Beam", "Sonido", "Aire Acondicionado"]},
            ]
        
        # Mapeo de días inglés -> español
        dias_map = {
            'monday': 'Lunes',
            'tuesday': 'Martes', 
            'wednesday': 'Miércoles',
            'thursday': 'Jueves',
            'friday': 'Viernes',
            'saturday': 'Sábado',
            'sunday': 'Domingo'
        }
        
        # Preparar datos de materias
        materias_data = []
        for idx, m in enumerate(request.materias):
            dias_espanol = [dias_map.get(d.lower(), d) for d in m.dias_preferidos]
            materias_data.append({
                "id": f"mat_{idx + 1}",
                "nombre_materia": m.nombre_materia,
                "semestre": m.semestre,
                "programa": m.programa,
                "docente": m.docente or "Por asignar",
                "numero_estudiantes": m.numero_estudiantes,
                "horas_semanales": m.horas_semanales,
                "tipo_espacio": m.tipo_espacio,
                "equipamiento_requerido": m.equipamiento_requerido,
                "dias_preferidos": dias_espanol,
                "hora_inicio_preferida": m.hora_inicio_preferida,
                "hora_fin_preferida": m.hora_fin_preferida
            })
        
        # Agrupar por semestre y programa para detectar conflictos
        grupos_estudiantes = {}
        for m in materias_data:
            key = f"{m['programa']}_{m['semestre']}"
            if key not in grupos_estudiantes:
                grupos_estudiantes[key] = []
            grupos_estudiantes[key].append(m['nombre_materia'])
        
        # Configurar Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        prompt = f"""Eres un experto sistema de programación académica universitaria. Tu tarea es crear un horario óptimo para las siguientes materias.

PERÍODO ACADÉMICO: {request.periodo_academico}
FECHAS: {request.fecha_inicio} al {request.fecha_fin}

MATERIAS A PROGRAMAR:
{json.dumps(materias_data, indent=2, ensure_ascii=False)}

ESPACIOS DISPONIBLES:
{json.dumps(espacios_disponibles, indent=2, ensure_ascii=False)}

GRUPOS DE ESTUDIANTES (mismo programa + semestre = mismos estudiantes):
{json.dumps(grupos_estudiantes, indent=2, ensure_ascii=False)}

REGLAS OBLIGATORIAS:
1. CRUCES DE HORARIO: Las materias del MISMO PROGRAMA Y SEMESTRE no pueden coincidir en horario (los mismos estudiantes las cursan)
2. ESPACIO ÚNICO: Un espacio solo puede tener UNA clase a la vez
3. CAPACIDAD: El espacio debe tener capacidad >= número de estudiantes
4. TIPO DE ESPACIO: Respetar el tipo solicitado (aula, laboratorio, auditorio)
5. HORAS SEMANALES: Distribuir las horas semanales de cada materia en los días preferidos
6. BLOQUES: Cada bloque de clase debe ser de 2 horas continuas máximo
7. HORARIO: Solo programar entre las horas preferidas de cada materia

PREFERENCIAS:
- Evitar huecos en el horario de los estudiantes
- Preferir espacios con el equipamiento requerido
- No usar espacios muy grandes para grupos pequeños

RESPONDE ÚNICAMENTE CON JSON VÁLIDO (sin explicaciones adicionales):
{{
    "success": true,
    "message": "Horario generado exitosamente para X materias",
    "horarios": [
        {{
            "materia": "Nombre de la materia",
            "semestre": "1",
            "programa": "Ingeniería de Sistemas",
            "docente": "Nombre del docente",
            "dia": "Lunes",
            "hora_inicio": "08:00",
            "hora_fin": "10:00",
            "espacio": "Aula 101",
            "espacio_id": 1,
            "capacidad_espacio": 40,
            "estudiantes": 25,
            "equipamiento": ["Video Beam", "Aire Acondicionado"]
        }}
    ],
    "conflictos": [
        "Descripción del conflicto 1 y cómo se resolvió",
        "Descripción del conflicto 2 y cómo se resolvió"
    ],
    "estadisticas": {{
        "total_materias": 5,
        "total_clases": 15,
        "conflictos_detectados": 0,
        "espacios_utilizados": 4,
        "horas_totales": 30,
        "eficiencia": 95
    }},
    "horario_por_dia": {{
        "Lunes": [
            {{"hora": "08:00-10:00", "materia": "X", "espacio": "Y", "programa": "Z", "semestre": "1"}}
        ],
        "Martes": [],
        "Miércoles": [],
        "Jueves": [],
        "Viernes": []
    }},
    "horario_por_semestre": {{
        "Ingeniería de Sistemas_1": [
            {{"materia": "X", "dia": "Lunes", "hora": "08:00-10:00", "espacio": "Y"}}
        ]
    }},
    "espacios_asignados": [
        {{"id": 1, "nombre": "Aula 101", "horas_ocupadas": 10, "materias": ["Mat1", "Mat2"]}}
    ],
    "recomendaciones": [
        "Se recomienda agregar más espacios tipo laboratorio",
        "El Aula 101 tiene alta ocupación"
    ]
}}

IMPORTANTE: 
- Cada materia debe aparecer en el horario tantas veces como sea necesario según sus horas semanales
- Si una materia tiene 4 horas semanales, debe aparecer 2 veces (bloques de 2 horas)
- Verificar que no haya cruces para estudiantes del mismo programa y semestre
- Si no puedes asignar alguna materia, agrégala a conflictos con la razón
- El campo "conflictos" debe ser un array de strings descriptivos"""

        # Ejecutar en thread pool
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            executor,
            lambda: model.generate_content(prompt)
        )
        
        if not response or not response.text:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo obtener respuesta del modelo de IA"
            )
        
        # Limpiar respuesta
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        
        ai_result = json.loads(text.strip())
        logger.info(f"Horario generado: {len(ai_result.get('horarios', []))} bloques de clase")
        
        # Convertir horarios a formato esperado
        horarios_formateados = []
        for clase in ai_result.get("horarios", []):
            horarios_formateados.append(HorarioItem(
                materia=clase.get("materia", ""),
                semestre=str(clase.get("semestre", "")),
                programa=clase.get("programa", ""),
                docente=clase.get("docente", "Por asignar"),
                dia=clase.get("dia", ""),
                hora_inicio=clase.get("hora_inicio", ""),
                hora_fin=clase.get("hora_fin", ""),
                espacio=clase.get("espacio", ""),
                espacio_id=clase.get("espacio_id"),
                capacidad_espacio=clase.get("capacidad_espacio"),
                estudiantes=clase.get("estudiantes"),
                equipamiento=clase.get("equipamiento", [])
            ))
        
        # Construir respuesta
        return GenerateScheduleResponse(
            success=ai_result.get("success", True),
            message=ai_result.get("message", "Horario generado exitosamente"),
            horarios=horarios_formateados,
            conflictos=ai_result.get("conflictos", []),
            estadisticas=ai_result.get("estadisticas", {}),
            horario_por_dia=ai_result.get("horario_por_dia", {}),
            horario_por_semestre=ai_result.get("horario_por_semestre", {}),
            espacios_asignados=ai_result.get("espacios_asignados", []),
            recomendaciones=ai_result.get("recomendaciones", []),
            model_used=GEMINI_MODEL,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing AI schedule response: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar la respuesta de IA. Por favor intente nuevamente."
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en generate-schedule: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar el horario: {str(e)}"
        )
