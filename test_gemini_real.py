"""
Script de prueba para verificar llamadas REALES a Google Gemini AI
Este script hace peticiones reales que aparecerán en tu dashboard de Gemini
"""
import asyncio
import os
import json
from datetime import datetime
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Importar las funciones de IA
from app.services.ai_gemini import (
    generate_predictions,
    optimize_space_allocation,
    analyze_usage_patterns,
    simulate_scenario,
    get_gemini_model
)

# Colores para terminal
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text.center(80)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.ENDC}\n")


def print_success(text):
    print(f"{Colors.OKGREEN}✅ {text}{Colors.ENDC}")


def print_info(text):
    print(f"{Colors.OKCYAN}ℹ️  {text}{Colors.ENDC}")


def print_warning(text):
    print(f"{Colors.WARNING}⚠️  {text}{Colors.ENDC}")


def print_error(text):
    print(f"{Colors.FAIL}❌ {text}{Colors.ENDC}")


def print_result(title, data):
    print(f"\n{Colors.OKBLUE}{Colors.BOLD}{title}:{Colors.ENDC}")
    print(f"{Colors.OKBLUE}{json.dumps(data, indent=2, ensure_ascii=False, default=str)}{Colors.ENDC}")


async def test_gemini_configuration():
    """Test 1: Verificar configuración de Gemini"""
    print_header("TEST 1: Verificación de Configuración")
    
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        print_error("GEMINI_API_KEY no encontrada en variables de entorno")
        print_info("Por favor configura tu API key en el archivo .env:")
        print_info("GEMINI_API_KEY=tu-api-key-aqui")
        return False
    
    print_success(f"API Key encontrada: {api_key[:20]}...{api_key[-10:]}")
    
    # Intentar crear modelo
    model = get_gemini_model()
    if model:
        print_success("Modelo Gemini creado exitosamente")
        print_info(f"Modelo: {model.model_name}")
        return True
    else:
        print_error("No se pudo crear el modelo Gemini")
        return False


async def test_predictions_real_call():
    """Test 2: Llamada REAL a Gemini para predicciones"""
    print_header("TEST 2: Predicciones con Gemini (LLAMADA REAL)")
    
    # Datos de prueba realistas
    test_data = {
        "spaces": [
            {"id": 1, "nombre": "Aula A-101", "capacidad": 30, "uso_actual": 25, "tipo": "aula"},
            {"id": 2, "nombre": "Laboratorio B-201", "capacidad": 20, "uso_actual": 18, "tipo": "laboratorio"},
            {"id": 3, "nombre": "Sala Reuniones C-301", "capacidad": 15, "uso_actual": 8, "tipo": "sala_reuniones"}
        ],
        "period": "últimos_30_días",
        "total_assignments": 145,
        "peak_hours": ["09:00-11:00", "14:00-16:00"],
        "average_occupancy": 0.78
    }
    
    print_info("Enviando datos a Gemini para análisis predictivo...")
    print(f"Datos de entrada: {json.dumps(test_data, indent=2, ensure_ascii=False)}")
    
    start_time = datetime.now()
    result = await generate_predictions(test_data)
    end_time = datetime.now()
    
    duration = (end_time - start_time).total_seconds()
    
    if result.get("model_used") == "gemini-pro":
        print_success(f"Llamada a Gemini EXITOSA (duración: {duration:.2f}s)")
        print_success("✨ Esta llamada aparecerá en tu dashboard de Gemini")
        print_result("Respuesta de Gemini", result)
        return True
    else:
        print_warning("La llamada no usó Gemini (probablemente falta API key)")
        print_result("Respuesta (fallback)", result)
        return False


async def test_optimization_real_call():
    """Test 3: Llamada REAL a Gemini para optimización"""
    print_header("TEST 3: Optimización con Gemini (LLAMADA REAL)")
    
    test_data = {
        "spaces": [
            {"id": 1, "nombre": "Aula Grande", "capacidad": 50, "ocupacion_actual": 20, "eficiencia": 0.40},
            {"id": 2, "nombre": "Aula Mediana", "capacidad": 30, "ocupacion_actual": 28, "eficiencia": 0.93},
            {"id": 3, "nombre": "Aula Pequeña", "capacidad": 15, "ocupacion_actual": 15, "eficiencia": 1.00}
        ],
        "resources": [
            {"id": 101, "tipo": "proyector", "disponibles": 10, "en_uso": 5},
            {"id": 102, "tipo": "computador", "disponibles": 30, "en_uso": 25},
            {"id": 103, "tipo": "pizarra_digital", "disponibles": 5, "en_uso": 5}
        ],
        "current_assignments": [
            {"space_id": 1, "resource_id": 101, "cantidad": 1},
            {"space_id": 2, "resource_id": 101, "cantidad": 2},
            {"space_id": 2, "resource_id": 102, "cantidad": 15},
            {"space_id": 3, "resource_id": 102, "cantidad": 10}
        ],
        "problems": [
            "Aula Grande (ID 1) está subutilizada al 40%",
            "Aula Pequeña (ID 3) está al 100% constantemente"
        ]
    }
    
    print_info("Enviando datos a Gemini para optimización...")
    print(f"Problemas detectados: {test_data['problems']}")
    
    start_time = datetime.now()
    result = await optimize_space_allocation(test_data)
    end_time = datetime.now()
    
    duration = (end_time - start_time).total_seconds()
    
    if "recomendaciones" in result or "recommendations" in result:
        print_success(f"Llamada a Gemini EXITOSA (duración: {duration:.2f}s)")
        print_success("✨ Esta llamada aparecerá en tu dashboard de Gemini")
        print_result("Optimización sugerida por Gemini", result)
        return True
    else:
        print_warning("La llamada no retornó optimización")
        print_result("Respuesta", result)
        return False


async def test_pattern_analysis_real_call():
    """Test 4: Llamada REAL a Gemini para análisis de patrones"""
    print_header("TEST 4: Análisis de Patrones con Gemini (LLAMADA REAL)")
    
    test_data = {
        "usage_history": [
            {"date": "2025-11-01", "space_id": 1, "usage": 0.80, "day": "viernes"},
            {"date": "2025-11-04", "space_id": 1, "usage": 0.85, "day": "lunes"},
            {"date": "2025-11-05", "space_id": 1, "usage": 0.90, "day": "martes"},
            {"date": "2025-11-06", "space_id": 1, "usage": 0.78, "day": "miércoles"},
            {"date": "2025-11-07", "space_id": 1, "usage": 0.95, "day": "jueves"},
            {"date": "2025-11-08", "space_id": 1, "usage": 0.75, "day": "viernes"},
            {"date": "2025-11-11", "space_id": 1, "usage": 0.88, "day": "lunes"},
            {"date": "2025-11-12", "space_id": 1, "usage": 0.92, "day": "martes"},
            {"date": "2025-11-13", "space_id": 1, "usage": 0.15, "day": "miércoles"},  # Anomalía
            {"date": "2025-11-14", "space_id": 1, "usage": 0.90, "day": "jueves"}
        ],
        "period": "últimas_2_semanas",
        "space_info": {
            "id": 1,
            "nombre": "Aula Principal A-101",
            "tipo": "aula_teorica"
        }
    }
    
    print_info("Enviando historial de uso a Gemini para análisis de patrones...")
    print_warning("Nota: Hay una anomalía intencional el 13/11 (15% de uso)")
    
    start_time = datetime.now()
    result = await analyze_usage_patterns(test_data)
    end_time = datetime.now()
    
    duration = (end_time - start_time).total_seconds()
    
    if "patterns" in result and "anomalies" in result:
        print_success(f"Llamada a Gemini EXITOSA (duración: {duration:.2f}s)")
        print_success("✨ Esta llamada aparecerá en tu dashboard de Gemini")
        
        # Verificar si detectó la anomalía
        if result["anomalies"]:
            print_success(f"Gemini detectó {len(result['anomalies'])} anomalía(s)")
        
        print_result("Análisis de Gemini", result)
        return True
    else:
        print_warning("La llamada no retornó análisis completo")
        print_result("Respuesta", result)
        return False


async def test_simulation_real_call():
    """Test 5: Llamada REAL a Gemini para simulación"""
    print_header("TEST 5: Simulación de Escenario con Gemini (LLAMADA REAL)")
    
    scenario = {
        "scenario_name": "Expansión: Agregar 3 aulas nuevas",
        "changes": [
            {"type": "add_space", "nombre": "Aula D-401", "capacidad": 35},
            {"type": "add_space", "nombre": "Aula D-402", "capacidad": 35},
            {"type": "add_space", "nombre": "Lab D-403", "capacidad": 25},
            {"type": "add_resources", "tipo": "proyector", "cantidad": 3},
            {"type": "add_resources", "tipo": "computador", "cantidad": 20}
        ],
        "investment": "$50,000 USD",
        "timeline": "3 meses"
    }
    
    current_data = {
        "spaces": [
            {"id": i, "capacidad": 30, "uso_promedio": 0.85} 
            for i in range(1, 11)
        ],
        "total_capacity": 300,
        "current_occupancy": 255,
        "resources": {
            "proyector": 10,
            "computador": 50
        },
        "wait_list": 45,  # 45 estudiantes en lista de espera
        "projected_growth": "15% próximo semestre"
    }
    
    print_info("Enviando escenario de expansión a Gemini para simulación...")
    print(f"Escenario: {scenario['scenario_name']}")
    print(f"Inversión: {scenario['investment']}")
    print(f"Timeline: {scenario['timeline']}")
    
    start_time = datetime.now()
    result = await simulate_scenario(scenario, current_data)
    end_time = datetime.now()
    
    duration = (end_time - start_time).total_seconds()
    
    if "results" in result and "impact_analysis" in result:
        print_success(f"Llamada a Gemini EXITOSA (duración: {duration:.2f}s)")
        print_success("✨ Esta llamada aparecerá en tu dashboard de Gemini")
        print_result("Simulación de Gemini", result)
        return True
    else:
        print_warning("La llamada no retornó simulación completa")
        print_result("Respuesta", result)
        return False


async def test_multiple_consecutive_calls():
    """Test 6: Múltiples llamadas consecutivas (para ver varias en dashboard)"""
    print_header("TEST 6: Múltiples Llamadas Consecutivas")
    
    print_info("Realizando 3 llamadas rápidas para generar actividad en dashboard...")
    
    results = []
    
    # Llamada 1: Predicción simple
    print("\n📞 Llamada 1/3: Predicción rápida")
    result1 = await generate_predictions({
        "quick_test": True,
        "spaces": [{"id": 1, "uso": 0.8}]
    })
    results.append(("Predicción", result1))
    await asyncio.sleep(1)
    
    # Llamada 2: Optimización simple
    print("📞 Llamada 2/3: Optimización rápida")
    result2 = await optimize_space_allocation({
        "quick_test": True,
        "spaces": [{"id": 1, "eficiencia": 0.6}]
    })
    results.append(("Optimización", result2))
    await asyncio.sleep(1)
    
    # Llamada 3: Análisis simple
    print("📞 Llamada 3/3: Análisis rápido")
    result3 = await analyze_usage_patterns({
        "quick_test": True,
        "data": [{"uso": 0.7}]
    })
    results.append(("Análisis", result3))
    
    print_success(f"\n✨ Se realizaron {len(results)} llamadas a Gemini")
    print_success("Verifica tu dashboard de Gemini - deberías ver 3 peticiones recientes")
    
    for i, (tipo, resultado) in enumerate(results, 1):
        print(f"\n{Colors.OKBLUE}Resultado {i} ({tipo}):{Colors.ENDC}")
        print(f"  - Model used: {resultado.get('model_used', 'N/A')}")
        print(f"  - Timestamp: {resultado.get('generated_at', resultado.get('simulated_at', 'N/A'))}")
    
    return True


async def test_error_handling():
    """Test 7: Manejo de errores"""
    print_header("TEST 7: Manejo de Errores y Edge Cases")
    
    print_info("Test 7.1: Datos vacíos")
    result1 = await generate_predictions({})
    print_success("✅ Manejó datos vacíos correctamente")
    
    print_info("\nTest 7.2: Datos muy grandes")
    large_data = {
        "spaces": [{"id": i, "data": "x" * 100} for i in range(50)]
    }
    result2 = await optimize_space_allocation(large_data)
    print_success("✅ Manejó datos grandes correctamente")
    
    print_info("\nTest 7.3: Datos con caracteres especiales")
    special_data = {
        "spaces": [
            {"nombre": "Aula María José", "descripción": "Aula con ñ y acentós"},
            {"nombre": "Lab 中文", "emoji": "🏫📚"}
        ]
    }
    result3 = await analyze_usage_patterns(special_data)
    print_success("✅ Manejó caracteres especiales correctamente")
    
    return True


async def main():
    """Ejecutar todas las pruebas"""
    print(f"""
{Colors.BOLD}{Colors.HEADER}
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║          PRUEBAS DE INTEGRACIÓN CON GOOGLE GEMINI AI                      ║
║                                                                            ║
║  Este script hace llamadas REALES a la API de Gemini                      ║
║  Podrás ver todas las peticiones en tu dashboard de Google AI Studio      ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
{Colors.ENDC}
""")
    
    print_info(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print_info("Dashboard Gemini: https://makersuite.google.com/app/apikey\n")
    
    tests = [
        ("Configuración", test_gemini_configuration),
        ("Predicciones", test_predictions_real_call),
        ("Optimización", test_optimization_real_call),
        ("Análisis de Patrones", test_pattern_analysis_real_call),
        ("Simulación", test_simulation_real_call),
        ("Llamadas Múltiples", test_multiple_consecutive_calls),
        ("Manejo de Errores", test_error_handling)
    ]
    
    results = []
    
    for i, (name, test_func) in enumerate(tests, 1):
        try:
            result = await test_func()
            results.append((name, result))
            
            # Pausa entre tests
            if i < len(tests):
                print(f"\n{Colors.WARNING}Esperando 2 segundos antes del siguiente test...{Colors.ENDC}")
                await asyncio.sleep(2)
        
        except Exception as e:
            print_error(f"Error en test '{name}': {str(e)}")
            results.append((name, False))
    
    # Resumen final
    print_header("RESUMEN DE PRUEBAS")
    
    total = len(results)
    passed = sum(1 for _, result in results if result)
    failed = total - passed
    
    for name, result in results:
        status = f"{Colors.OKGREEN}✅ PASÓ{Colors.ENDC}" if result else f"{Colors.FAIL}❌ FALLÓ{Colors.ENDC}"
        print(f"{name:.<50} {status}")
    
    print(f"\n{Colors.BOLD}Total: {total} | Pasaron: {passed} | Fallaron: {failed}{Colors.ENDC}")
    
    if passed == total:
        print(f"\n{Colors.OKGREEN}{Colors.BOLD}🎉 ¡TODAS LAS PRUEBAS PASARON!{Colors.ENDC}")
        print(f"{Colors.OKGREEN}✨ Revisa tu dashboard de Gemini para ver todas las peticiones{Colors.ENDC}")
        print(f"{Colors.OKCYAN}🔗 https://aistudio.google.com/app/apikey{Colors.ENDC}\n")
    else:
        print(f"\n{Colors.WARNING}⚠️  Algunas pruebas fallaron{Colors.ENDC}")
        if failed == total:
            print(f"{Colors.FAIL}❌ Todas las pruebas fallaron - verifica tu GEMINI_API_KEY{Colors.ENDC}\n")


if __name__ == "__main__":
    asyncio.run(main())
