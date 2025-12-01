from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.db.session import init_db
from app.api.v1 import auth, spaces, resources, assignments, analytics, notifications, chatbot


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_initial_data()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="""
## Sistema de Gestión Inteligente de Espacios Físicos

API REST para la gestión inteligente de espacios físicos con funcionalidades de IA, 
optimización, analítica y notificaciones.

### Características principales:
- **Gestión de Espacios**: CRUD completo para espacios físicos
- **Gestión de Recursos**: CRUD completo para recursos asignables
- **Asignaciones**: Gestión de asignaciones espacio-recurso con optimización
- **Analytics**: Métricas de uso, eficiencia y predicciones con IA
- **Notificaciones**: Sistema de alertas y preferencias de usuario
- **IA con Gemini**: Optimización inteligente y predicciones

### Autenticación:
Usa OAuth2 con tokens JWT. Obtén tu token en `/api/v1/auth/login`.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(spaces.router, prefix="/api/v1")
app.include_router(resources.router, prefix="/api/v1")
app.include_router(assignments.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(chatbot.router, prefix="/api/v1")


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Sistema de Gestión Inteligente de Espacios Físicos",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


async def seed_initial_data():
    """Seed initial data if database is empty."""
    from app.db.session import AsyncSessionLocal
    from app.db.crud import UserCRUD, SpaceCRUD, ResourceCRUD, CategoryCRUD
    from app.core.security import get_password_hash
    
    async with AsyncSessionLocal() as db:
        try:
            existing_admin = await UserCRUD.get_by_username(db, "admin")
            if existing_admin:
                return
            
            admin = await UserCRUD.create(
                db,
                {
                    "username": "admin",
                    "password_hash": get_password_hash("admin123"),
                    "email": "admin@example.com",
                    "nombre_completo": "Administrator",
                    "rol": "admin",
                    "is_active": True
                }
            )
            
            standard_user = await UserCRUD.create(
                db,
                {
                    "username": "usuario",
                    "password_hash": get_password_hash("usuario123"),
                    "email": "usuario@example.com",
                    "nombre_completo": "Usuario Estándar",
                    "rol": "estudiante",
                    "is_active": True
                }
            )
            
            cat_oficina = await CategoryCRUD.create(
                db,
                nombre="Equipos de Oficina",
                descripcion="Equipos y mobiliario para espacios de oficina"
            )
            
            cat_conferencia = await CategoryCRUD.create(
                db,
                nombre="Equipos de Conferencia",
                descripcion="Equipos para salas de reuniones y conferencias"
            )
            
            cat_laboratorio = await CategoryCRUD.create(
                db,
                nombre="Equipos de Laboratorio",
                descripcion="Instrumentos y equipos científicos"
            )
            
            space1 = await SpaceCRUD.create(
                db,
                nombre="Oficina Principal A",
                tipo="office",
                capacidad=10,
                ubicacion="Edificio A, Piso 1",
                descripcion="Oficina amplia con excelente iluminación natural y mobiliario moderno",
                caracteristicas=["Aire Acondicionado", "4 Ventanas", "Conexión Fibra Óptica", "Mobiliario Moderno"],
                estado="disponible",
                imagen_url="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800"
            )
            
            space2 = await SpaceCRUD.create(
                db,
                nombre="Sala de Reuniones 101",
                tipo="conference",
                capacidad=20,
                ubicacion="Edificio A, Piso 1",
                descripcion="Sala de reuniones equipada con tecnología de videoconferencia de última generación",
                caracteristicas=["Proyector HD", "Videoconferencia", "Pizarra Digital", "Mesa de Conferencias", "WiFi de Alta Velocidad"],
                estado="disponible",
                imagen_url="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800"
            )
            
            space3 = await SpaceCRUD.create(
                db,
                nombre="Laboratorio de Investigación",
                tipo="laboratory",
                capacidad=8,
                ubicacion="Edificio B, Piso 2",
                descripcion="Laboratorio científico con bioseguridad nivel 2 y equipamiento especializado",
                caracteristicas=["Bioseguridad Nivel 2", "Campana de Extracción", "Microscopios", "Equipos de Análisis", "Sistema de Ventilación"],
                estado="disponible",
                imagen_url="https://images.unsplash.com/photo-1581093458791-9d42e3f7e1f9?auto=format&fit=crop&w=800"
            )
            
            space4 = await SpaceCRUD.create(
                db,
                nombre="Auditorio Principal",
                tipo="auditorium",
                capacidad=100,
                ubicacion="Edificio C, Planta Baja",
                descripcion="Auditorio moderno con excelente acústica y equipamiento profesional de audio e iluminación",
                caracteristicas=["Sistema de Audio Profesional", "Iluminación de Escenario", "Proyector 4K", "Asientos Ergonómicos", "Accesibilidad Universal"],
                estado="disponible",
                imagen_url="https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=800"
            )
            
            resource1 = await ResourceCRUD.create(
                db,
                nombre="Proyector Epson EB-2250U",
                tipo="proyector",
                estado="disponible",
                categoria_id=cat_conferencia.id,
                caracteristicas={"lumenes": 5000, "resolucion": "WUXGA"}
            )
            
            resource2 = await ResourceCRUD.create(
                db,
                nombre="Sistema de Videoconferencia Poly",
                tipo="sistema de videoconferencia",
                estado="disponible",
                categoria_id=cat_conferencia.id,
                caracteristicas={"camara_4k": True, "microfono_array": True}
            )
            
            resource3 = await ResourceCRUD.create(
                db,
                nombre="Computadora Dell Optiplex 7090",
                tipo="computadora",
                estado="disponible",
                categoria_id=cat_oficina.id,
                caracteristicas={"ram_gb": 16, "ssd_gb": 512, "procesador": "i7-11700"}
            )
            
            resource4 = await ResourceCRUD.create(
                db,
                nombre="Microscopio Olympus BX53",
                tipo="equipo científico",
                estado="disponible",
                categoria_id=cat_laboratorio.id,
                caracteristicas={"tipo": "optico", "aumento_max": "1000x"}
            )
            
            resource5 = await ResourceCRUD.create(
                db,
                nombre="Mesa de Trabajo Ergonómica",
                tipo="mobiliario",
                estado="disponible",
                categoria_id=cat_oficina.id,
                caracteristicas={"ajustable": True, "dimensiones": "160x80cm"}
            )
            
            await db.commit()
            print("Initial data seeded successfully!")
            
        except Exception as e:
            await db.rollback()
            print(f"Error seeding data (may already exist): {e}")
