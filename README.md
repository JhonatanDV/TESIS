# Sistema de Gestión Inteligente de Espacios Físicos

API REST para la gestión inteligente de espacios físicos con funcionalidades de IA, optimización, analítica y notificaciones.

## Características

- **Gestión de Espacios**: CRUD completo para espacios físicos (oficinas, salas de reuniones, laboratorios, etc.)
- **Gestión de Recursos**: CRUD completo para recursos asignables a espacios
- **Asignaciones**: Gestión de asignaciones espacio-recurso con optimización automática
- **Analytics**: Métricas de uso, eficiencia y predicciones con IA (Google Gemini)
- **Notificaciones**: Sistema de alertas y preferencias de usuario
- **IA con Gemini**: Optimización inteligente y predicciones de uso

## Tecnologías

- **Backend**: FastAPI (ASGI)
- **Servidor**: Uvicorn
- **ORM**: SQLAlchemy Async
- **Base de Datos**: SQLite (desarrollo) / MySQL (producción)
- **Autenticación**: OAuth2 + JWT
- **IA**: Google Gemini
- **Tests**: pytest + httpx

## Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd space-management-system
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y configura las variables:

```bash
cp .env.example .env
```

Edita `.env` con tus configuraciones:

```env
# Base de datos SQLite (desarrollo)
DATABASE_URL=sqlite+aiosqlite:///./dev.db

# O MySQL (producción)
# DATABASE_URL=mysql+aiomysql://root:password@localhost:3306/438B8041db8a0124

# JWT
SECRET_KEY=tu-clave-secreta-muy-segura
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Google Gemini
GEMINI_API_KEY=tu-api-key-de-gemini
```

### 4. Ejecutar el servidor

```bash
uvicorn app.main:app --host=0.0.0.0 --port=5000 --reload
```

O usar el script:

```bash
bash scripts/start.sh
```

## Uso en Replit

1. El proyecto está configurado para ejecutarse automáticamente en Replit
2. La base de datos SQLite se crea automáticamente al iniciar
3. Se crean datos de ejemplo (usuarios, espacios, recursos)

### Credenciales por defecto

- **Admin**: username=`admin`, password=`admin123`
- **Usuario estándar**: username=`usuario`, password=`usuario123`

## API Endpoints

### Autenticación
- `POST /api/v1/auth/login` - Iniciar sesión
- `POST /api/v1/auth/refresh` - Refrescar token
- `POST /api/v1/auth/logout` - Cerrar sesión

### Espacios
- `GET /api/v1/spaces` - Listar espacios
- `GET /api/v1/spaces/{id}` - Obtener espacio
- `POST /api/v1/spaces` - Crear espacio (admin)
- `PUT /api/v1/spaces/{id}` - Actualizar espacio (admin)
- `DELETE /api/v1/spaces/{id}` - Eliminar espacio (admin)
- `GET /api/v1/spaces/available` - Espacios disponibles

### Recursos
- `GET /api/v1/resources` - Listar recursos
- `GET /api/v1/resources/{id}` - Obtener recurso
- `POST /api/v1/resources` - Crear recurso (admin)
- `PUT /api/v1/resources/{id}` - Actualizar recurso (admin)
- `DELETE /api/v1/resources/{id}` - Eliminar recurso (admin)
- `GET /api/v1/resources/categories` - Listar categorías

### Asignaciones
- `GET /api/v1/assignments` - Listar asignaciones
- `GET /api/v1/assignments/{id}` - Obtener asignación
- `POST /api/v1/assignments` - Crear asignación
- `PUT /api/v1/assignments/{id}` - Actualizar asignación
- `DELETE /api/v1/assignments/{id}` - Eliminar asignación (admin)
- `POST /api/v1/assignments/optimize` - Optimizar asignaciones (admin)

### Analytics
- `GET /api/v1/analytics/usage` - Métricas de uso
- `GET /api/v1/analytics/efficiency` - Métricas de eficiencia
- `GET /api/v1/analytics/predictions` - Predicciones con IA
- `POST /api/v1/analytics/simulate` - Simular escenario (admin)

### Notificaciones
- `GET /api/v1/notifications` - Listar notificaciones
- `POST /api/v1/notifications` - Crear notificación (admin)
- `GET /api/v1/notifications/settings` - Obtener configuración
- `PUT /api/v1/notifications/settings` - Actualizar configuración

## Documentación Interactiva

- **Swagger UI**: http://localhost:5000/docs
- **ReDoc**: http://localhost:5000/redoc

## Estructura del Proyecto

```
/app
  main.py              # Aplicación FastAPI principal
  config.py            # Configuración con Pydantic
  /core
    security.py        # JWT, hashing, roles
  /db
    base.py            # Base declarativa SQLAlchemy
    session.py         # Engine y sesión async
    models.py          # Modelos de base de datos
    crud.py            # Operaciones CRUD
  /schemas
    *.py               # Esquemas Pydantic
  /api/v1
    auth.py            # Endpoints de autenticación
    spaces.py          # Endpoints de espacios
    resources.py       # Endpoints de recursos
    assignments.py     # Endpoints de asignaciones
    analytics.py       # Endpoints de analytics
    notifications.py   # Endpoints de notificaciones
  /services
    ai_gemini.py       # Integración con Gemini
    optimizer.py       # Algoritmo de optimización
    notifications.py   # Servicio de notificaciones
/scripts
  start.sh             # Script de arranque
  init_db.sh           # Inicialización de BD
/tests
  test_auth.py         # Tests de autenticación
  test_spaces.py       # Tests de espacios
```

## Configuración de MySQL (Producción)

Para usar MySQL en lugar de SQLite:

```env
DATABASE_URL=mysql+aiomysql://root:password@localhost:3306/438B8041db8a0124
```

Sin contraseña (no recomendado):
```env
DATABASE_URL=mysql+aiomysql://root@localhost:3306/438B8041db8a0124
```

## Tests

Ejecutar tests:

```bash
pytest tests/ -v
```

## Licencia

MIT License
