from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.db.session import init_db
from app.api.v1 import auth, spaces, resources, assignments, analytics, notifications


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
    
    async with AsyncSessionLocal() as db:
        try:
            existing_admin = await UserCRUD.get_by_username(db, "admin")
            if existing_admin:
                return
            
            admin = await UserCRUD.create(
                db,
                username="admin",
                password="admin123",
                email="admin@example.com",
                rol="admin"
            )
            
            standard_user = await UserCRUD.create(
                db,
                username="usuario",
                password="usuario123",
                email="usuario@example.com",
                rol="standard"
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
                tipo="oficina",
                capacidad=10,
                ubicacion="Edificio A, Piso 1",
                caracteristicas={"aire_acondicionado": True, "ventanas": 4},
                estado="disponible"
            )
            
            space2 = await SpaceCRUD.create(
                db,
                nombre="Sala de Reuniones 101",
                tipo="sala de reuniones",
                capacidad=20,
                ubicacion="Edificio A, Piso 1",
                caracteristicas={"proyector": True, "videoconferencia": True},
                estado="disponible"
            )
            
            space3 = await SpaceCRUD.create(
                db,
                nombre="Laboratorio de Investigación",
                tipo="laboratorio",
                capacidad=8,
                ubicacion="Edificio B, Piso 2",
                caracteristicas={"bioseguridad": "nivel 2", "campana_extraccion": True},
                estado="disponible"
            )
            
            space4 = await SpaceCRUD.create(
                db,
                nombre="Auditorio Principal",
                tipo="auditorio",
                capacidad=100,
                ubicacion="Edificio C, Planta Baja",
                caracteristicas={"sistema_audio": True, "iluminacion_escenario": True},
                estado="disponible"
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
