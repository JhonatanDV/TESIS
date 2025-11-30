# Sistema de Gestión Inteligente de Espacios Físicos 🏢

API REST completa para la gestión inteligente de espacios físicos universitarios con funcionalidades de IA, optimización automática, analíticas y notificaciones en tiempo real.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#️-tecnologías)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Configuración](#️-configuración)
- [Base de Datos](#-base-de-datos)
- [Uso](#-uso)
- [API Endpoints](#-api-endpoints)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Documentación](#-documentación)

## ✨ Características

### Gestión Completa
- ✅ **Espacios Físicos**: CRUD completo de 51 aulas distribuidas en 3 sedes
- ✅ **Recursos**: Gestión de equipamiento (proyectores, computadores, mesas, etc.)
- ✅ **Asignaciones**: Sistema de reservas y asignación de espacios
- ✅ **Usuarios**: Autenticación y autorización con roles

### Inteligencia Artificial
- 🤖 **Predicciones**: Análisis predictivo de uso de espacios
- 📊 **Optimización**: Sugerencias automáticas para mejor uso de recursos
- 🔍 **Patrones**: Detección de patrones y anomalías en el uso
- 🎯 **Simulaciones**: Escenarios hipotéticos de cambios

### Analytics y Reportes
- 📈 **Dashboard**: Métricas en tiempo real
- 📉 **Tendencias**: Análisis histórico de uso
- 🎨 **Visualizaciones**: Gráficos y reportes detallados
- ⚠️ **Alertas**: Notificaciones automáticas de eventos

### Seguridad
- 🔐 **OAuth2**: Autenticación con JWT tokens
- 🔒 **Bcrypt**: Hashing seguro de contraseñas
- 👥 **RBAC**: Control de acceso basado en roles
- 🛡️ **Validación**: Esquemas Pydantic para todos los endpoints

## 🛠️ Tecnologías

### Backend
- **FastAPI** 0.115.12 - Framework web moderno y rápido
- **Uvicorn** 0.35.1 - Servidor ASGI de alto rendimiento
- **Pydantic** 2.12.1 - Validación de datos

### Base de Datos
- **SQLAlchemy** 2.0.37 - ORM async
- **Alembic** 1.14.1 - Migraciones
- **MySQL** (producción) - Base de datos relacional
- **SQLite** (desarrollo) - Base de datos local

### Inteligencia Artificial
- **Google Generative AI** 0.8.5 - Gemini 2.0 Flash

### Seguridad
- **python-jose** 3.4.0 - JWT tokens
- **passlib** 1.7.4 - Hashing de contraseñas
- **cryptography** 46.0.3 - Funciones criptográficas

### Testing
- **pytest** 9.0.1 - Framework de testing
- **pytest-asyncio** 1.3.0 - Tests asíncronos
- **httpx** 0.29.0 - Cliente HTTP async

## 📦 Requisitos

- Python 3.11+
- MySQL 8.0+ (producción)
- pip
- virtualenv (recomendado)

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd FastAPICreation
```

### 2. Crear entorno virtual

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux/Mac
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus configuraciones:

```env
# Base de datos MySQL (producción)
DATABASE_URL=mysql+aiomysql://root:password@localhost:3306/aulas_pasto

# O SQLite (desarrollo/testing)
# DATABASE_URL=sqlite+aiosqlite:///./dev.db

# Seguridad JWT
SECRET_KEY=tu-clave-secreta-muy-segura-cambiala-en-produccion
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Google Gemini AI
GEMINI_API_KEY=tu-api-key-de-google-gemini

# Aplicación
PROJECT_NAME=Sistema de Gestión de Espacios
VERSION=1.0.0
DEBUG=False
```

## 🗄️ Base de Datos

### Inicializar MySQL

1. **Crear base de datos y poblar con datos iniciales:**

```bash
# Método 1: Script Python
python scripts/run_sql_file.py

# Método 2: MySQL CLI
mysql -u root -p < scripts/init_db.sql
```

Esto creará:
- Base de datos `aulas_pasto`
- 11 tablas relacionales
- 51 aulas distribuidas en 3 sedes
- Datos de lookup (entornos, ambientes, tipos de espacios)

2. **Ejecutar migraciones con Alembic:**

```bash
python -m alembic -c alembic.ini upgrade head
```

3. **Verificar la instalación:**

```bash
python scripts/check_mysql_tables.py
```

### Estructura de Base de Datos

El sistema usa una base de datos relacional con **11 tablas**:

1. **campuses** - Sedes universitarias (3 sedes)
2. **blocks** - Bloques dentro de sedes
3. **floors** - Pisos dentro de bloques
4. **entornos** - Tipos de entorno (Formación, Bienestar, etc.)
5. **ambientes** - Ambientes específicos (TIC, Automatización, etc.)
6. **space_types** - Tipos de espacios (Aula, Laboratorio, etc.)
7. **categories** - Categorías de recursos
8. **resources** - Recursos disponibles
9. **rooms** - **51 aulas físicas** con jerarquía completa
10. **rooms_resources** - Tabla pivote (relación N:M)
11. **assignments** - Asignaciones de espacios

### Diagrama de Relaciones

```
campuses (1) → (N) blocks (1) → (N) floors (1) → (N) rooms
                                                      ↓
                                                  (N:M via rooms_resources)
                                                      ↓
entornos (1) → (N) ambientes (1) → (N) rooms    resources (N) → (1) categories
space_types (1) → (N) rooms
```

## 💻 Uso

### Iniciar el servidor

```bash
# Desarrollo (con hot-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 5000

# Producción
uvicorn app.main:app --host 0.0.0.0 --port 5000 --workers 4
```

### Acceder a la aplicación

- **API Base**: http://localhost:5000
- **Documentación interactiva**: http://localhost:5000/docs
- **ReDoc**: http://localhost:5000/redoc

### Credenciales de prueba

Para crear un usuario inicial, usa los endpoints de autenticación o crea uno directamente en la base de datos.

## 📡 API Endpoints

### 🔐 Autenticación (`/api/v1/auth`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/login` | Iniciar sesión (obtener token) | No |
| POST | `/refresh` | Renovar access token | No |
| POST | `/logout` | Cerrar sesión | Sí |

### 🏢 Espacios (`/api/v1/spaces`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | Listar todos los espacios | Sí |
| GET | `/{id}` | Obtener espacio por ID | Sí |
| POST | `/` | Crear nuevo espacio | Sí |
| PUT | `/{id}` | Actualizar espacio | Sí |
| DELETE | `/{id}` | Eliminar espacio | Sí |
| GET | `/available` | Listar espacios disponibles | Sí |

### 📦 Recursos (`/api/v1/resources`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | Listar todos los recursos | Sí |
| GET | `/{id}` | Obtener recurso por ID | Sí |
| POST | `/` | Crear nuevo recurso | Sí |
| PUT | `/{id}` | Actualizar recurso | Sí |
| DELETE | `/{id}` | Eliminar recurso | Sí |
| GET | `/available` | Listar recursos disponibles | Sí |

### 📅 Asignaciones (`/api/v1/assignments`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | Listar asignaciones | Sí |
| GET | `/{id}` | Obtener asignación por ID | Sí |
| POST | `/` | Crear asignación | Sí |
| PUT | `/{id}` | Actualizar asignación | Sí |
| DELETE | `/{id}` | Cancelar asignación | Sí |
| POST | `/optimize` | Optimizar asignaciones con IA | Sí |

### 📊 Analytics (`/api/v1/analytics`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/dashboard` | Dashboard de métricas | Sí |
| POST | `/predictions` | Predicciones con IA Gemini | Sí |
| POST | `/usage-patterns` | Análisis de patrones de uso | Sí |
| POST | `/simulate` | Simular escenario hipotético | Sí |

### 🔔 Notificaciones (`/api/v1/notifications`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | Listar notificaciones del usuario | Sí |
| GET | `/{id}` | Obtener notificación por ID | Sí |
| PUT | `/{id}/read` | Marcar como leída | Sí |
| DELETE | `/{id}` | Eliminar notificación | Sí |
| GET | `/unread/count` | Contar notificaciones no leídas | Sí |

## 🧪 Testing

### Ejecutar todos los tests

```bash
# Con output detallado
pytest tests/ -v

# Con coverage
pytest tests/ --cov=app --cov-report=html

# Solo un archivo
pytest tests/test_auth.py -v

# Solo una función
pytest tests/test_auth.py::test_login_success -v
```

### Tests implementados

**`tests/test_auth.py`** - Autenticación (4 tests)
- ✅ Login exitoso
- ✅ Login con credenciales inválidas
- ✅ Renovación de token
- ✅ Logout

**`tests/test_spaces.py`** - Espacios (7 tests)
- ✅ Crear espacio
- ✅ Listar espacios
- ✅ Obtener espacio por ID
- ✅ Actualizar espacio
- ✅ Eliminar espacio
- ✅ Listar espacios disponibles
- ✅ Acceso no autorizado

### Resultados actuales

```
11 passed, 33 warnings in 5.39s
✅ 100% de tests pasando
```

## 🚀 Deployment

### Replit

El proyecto está configurado para ejecutarse automáticamente en Replit:

1. Fork el proyecto en Replit
2. Las variables de entorno se configuran en "Secrets"
3. Click en "Run"

### Docker (Próximamente)

```bash
# Build
docker build -t space-management-api .

# Run
docker run -p 5000:5000 space-management-api
```

### Producción

1. **Configurar variables de entorno**
2. **Usar MySQL en lugar de SQLite**
3. **Configurar SECRET_KEY único y seguro**
4. **Desactivar DEBUG=False**
5. **Usar workers de Uvicorn**:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 5000 --workers 4
```

6. **Configurar proxy reverso (nginx)**
7. **Habilitar HTTPS**

## 📚 Documentación

### Documentación automática

- **Swagger UI**: http://localhost:5000/docs - Interfaz interactiva
- **ReDoc**: http://localhost:5000/redoc - Documentación detallada
- **OpenAPI Schema**: http://localhost:5000/openapi.json - Especificación JSON

### Archivos de documentación

- **COMPLIANCE.md** - Reporte completo de cumplimiento de requisitos
- **README.md** - Este archivo
- **API Docs** - Generada automáticamente por FastAPI

## 🤖 Integración con Google Gemini AI

El sistema integra Google Gemini AI para funcionalidades avanzadas:

### Funcionalidades implementadas

1. **Predicciones de uso** (`generate_predictions`)
   - Análisis predictivo de ocupación
   - Tendencias de uso futuro
   - Recomendaciones de capacidad

2. **Optimización de asignaciones** (`optimize_space_allocation`)
   - Sugerencias de reasignación
   - Score de optimización
   - Impacto estimado de cambios

3. **Análisis de patrones** (`analyze_usage_patterns`)
   - Detección de patrones recurrentes
   - Identificación de anomalías
   - Análisis de tendencias

4. **Simulación de escenarios** (`simulate_scenario`)
   - Simulación de cambios hipotéticos
   - Análisis de impacto
   - Evaluación de viabilidad

### Configuración

```env
GEMINI_API_KEY=tu-api-key-aqui
```

Obtén tu API key en: https://makersuite.google.com/app/apikey

## 🏗️ Estructura del Proyecto

```
FastAPICreation/
├── app/
│   ├── __init__.py
│   ├── main.py                    # Aplicación principal
│   ├── config.py                  # Configuración
│   │
│   ├── api/                       # Endpoints API
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── auth.py           # Autenticación
│   │       ├── spaces.py         # Gestión de espacios
│   │       ├── resources.py      # Gestión de recursos
│   │       ├── assignments.py    # Asignaciones
│   │       ├── analytics.py      # Analytics e IA
│   │       └── notifications.py  # Notificaciones
│   │
│   ├── core/                      # Funcionalidades core
│   │   ├── __init__.py
│   │   └── security.py           # JWT, hashing
│   │
│   ├── db/                        # Base de datos
│   │   ├── __init__.py
│   │   ├── base.py               # Declarative Base
│   │   ├── session.py            # Sesiones async
│   │   ├── models.py             # Modelos SQLAlchemy
│   │   ├── crud.py               # Operaciones CRUD
│   │   └── alembic/              # Migraciones
│   │       ├── env.py
│   │       └── versions/
│   │           └── 0001_initial.py
│   │
│   ├── schemas/                   # Esquemas Pydantic
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── space.py
│   │   ├── resource.py
│   │   ├── assignment.py
│   │   ├── category.py
│   │   ├── notification.py
│   │   ├── analytics.py
│   │   ├── ai_model.py
│   │   └── usage_data.py
│   │
│   └── services/                  # Servicios
│       ├── __init__.py
│       ├── ai_gemini.py          # Integración Gemini AI
│       ├── optimizer.py          # Optimización
│       └── notifications.py      # Sistema de notificaciones
│
├── tests/                         # Tests
│   ├── __init__.py
│   ├── conftest.py               # Fixtures pytest
│   ├── test_auth.py              # Tests autenticación
│   └── test_spaces.py            # Tests espacios
│
├── scripts/                       # Scripts de utilidad
│   ├── init_db.sql               # Schema + datos SQL
│   ├── init_db.sh                # Inicialización bash
│   ├── start.sh                  # Inicio del servidor
│   ├── run_sql_file.py           # Ejecutar SQL
│   └── check_mysql_tables.py    # Verificar tablas
│
├── .env.example                   # Variables de entorno ejemplo
├── .replit                        # Configuración Replit
├── alembic.ini                    # Configuración Alembic
├── pyproject.toml                 # Configuración proyecto
├── requirements.txt               # Dependencias Python
├── COMPLIANCE.md                  # Reporte de cumplimiento
└── README.md                      # Este archivo
```

## 🔧 Comandos Útiles

### Base de datos

```bash
# Crear base de datos y poblar
python scripts/run_sql_file.py

# Crear migración
python -m alembic -c alembic.ini revision --autogenerate -m "descripcion"

# Aplicar migraciones
python -m alembic -c alembic.ini upgrade head

# Revertir última migración
python -m alembic -c alembic.ini downgrade -1

# Ver estado de migraciones
python -m alembic -c alembic.ini current

# Verificar tablas
python scripts/check_mysql_tables.py
```

### Testing

```bash
# Todos los tests
pytest tests/ -v

# Con coverage
pytest tests/ --cov=app --cov-report=html

# Tests específicos
pytest tests/test_auth.py -v
pytest tests/test_spaces.py::test_create_space -v

# Con output detallado
pytest tests/ -v -s
```

### Desarrollo

```bash
# Servidor con hot-reload
uvicorn app.main:app --reload --port 5000

# Ver logs detallados
uvicorn app.main:app --reload --log-level debug

# Verificar imports
python -c "from app.main import app; print('OK')"
```

## 🐛 Troubleshooting

### Error: "No module named 'app'"

```bash
# Asegúrate de estar en el directorio raíz
cd FastAPICreation
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### Error: "Database not found"

```bash
# Verificar que MySQL esté corriendo
mysql -u root -p -e "SHOW DATABASES;"

# Recrear base de datos
python scripts/run_sql_file.py
```

### Error: "ImportError: cannot import name 'genai'"

```bash
# Reinstalar dependencia de Gemini
pip install --upgrade google-generativeai
```

### Tests fallan con "asyncio_mode" error

```bash
# Ya está configurado en pyproject.toml
# Verificar que pytest-asyncio esté instalado
pip install pytest-asyncio
```

## 📊 Métricas del Proyecto

- **Líneas de código**: ~5,000+
- **Archivos Python**: 45+
- **Endpoints API**: 30+
- **Tests**: 11 (100% passing)
- **Tablas DB**: 11
- **Aulas registradas**: 51
- **Cobertura**: Funcionalidades core completas

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo licencia MIT.
