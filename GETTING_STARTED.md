# 🚀 Sistema de Gestión de Espacios - Guía de Inicio Rápido

## ✅ Pasos para Iniciar el Sistema Completo

### 1️⃣ Instalar Dependencias del Frontend

```bash
cd Front-API-main
npm install
```

### 2️⃣ Iniciar el Backend (FastAPI)

**Opción A: Desde la raíz del proyecto**
```bash
cd ..
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Opción B: Usando Python directamente**
```bash
cd ..
python -m uvicorn app.main:app --reload --port 8000
```

El backend estará disponible en: `http://localhost:8000`
- Documentación API: `http://localhost:8000/docs`
- Redoc: `http://localhost:8000/redoc`

### 3️⃣ Iniciar el Frontend (React)

**En una nueva terminal:**
```bash
cd Front-API-main
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

---

## 🔧 Configuración Inicial

### Backend (.env en raíz)
```env
DATABASE_URL=sqlite+aiosqlite:///./test.db
SECRET_KEY=tu-secret-key-super-segura-aqui
GEMINI_API_KEY=tu-api-key-de-gemini
```

### Frontend (.env en Front-API-main/)
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_VERSION=v1
```

---

## 📋 Checklist de Verificación

### Backend
- [ ] Base de datos inicializada
- [ ] FastAPI corriendo en puerto 8000
- [ ] `/docs` accesible
- [ ] GEMINI_API_KEY configurada (opcional, funciona sin ella)

### Frontend
- [ ] Dependencias instaladas (`node_modules` existe)
- [ ] `.env` configurado
- [ ] Frontend corriendo en puerto 5173
- [ ] Pantalla de login visible

---

## 🧪 Probar la Integración

### 1. Registrar Usuario
1. Abrir `http://localhost:5173`
2. Click en "Register"
3. Completar formulario
4. Primer usuario será **admin** automáticamente

### 2. Ver Espacios
1. Login exitoso → Dashboard
2. Sidebar → "Spaces"
3. Deberían cargar desde el backend

### 3. Crear Espacio
1. Click "Add Space"
2. Completar formulario
3. Submit → Se guarda en backend
4. Verificar en `http://localhost:8000/docs` → `/api/v1/spaces`

### 4. Probar IA (si Gemini configurado)
1. Sidebar → "AI Analytics" o similar
2. Generar predicciones
3. Ver métricas en tiempo real
4. Verificar llamadas en dashboard de Gemini

---

## 🐛 Troubleshooting

### Error: "Network Error"
**Causa**: Backend no está corriendo
**Solución**: 
```bash
cd FastAPICreation
uvicorn app.main:app --reload --port 8000
```

### Error: "Cannot find module 'axios'"
**Causa**: Dependencias no instaladas
**Solución**:
```bash
cd Front-API-main
npm install
```

### Error: "CORS policy blocked"
**Causa**: CORS no configurado en backend
**Verificar**: `app/main.py` debe tener:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Base de Datos Vacía
**Solución**:
```bash
cd FastAPICreation
python -c "from app.db.base import init_db; import asyncio; asyncio.run(init_db())"
```

---

## 📊 Endpoints Principales

### Autenticación
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Registro
- `GET /api/v1/auth/me` - Usuario actual

### Espacios
- `GET /api/v1/spaces` - Listar espacios
- `POST /api/v1/spaces` - Crear espacio
- `GET /api/v1/spaces/available` - Espacios disponibles

### IA y Analytics
- `POST /api/v1/analytics/predictions` - Predicciones IA
- `POST /api/v1/assignments/optimize` - Optimización IA
- `GET /api/v1/analytics/usage` - Métricas de uso
- `GET /api/v1/analytics/efficiency` - Eficiencia

---

## 🚀 Scripts Útiles

### Iniciar Todo (PowerShell)
```powershell
# Terminal 1 - Backend
cd FastAPICreation
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd Front-API-main
npm run dev
```

### Verificar Estado
```bash
# Backend
curl http://localhost:8000/

# Frontend
curl http://localhost:5173/
```

### Limpiar y Reinstalar
```bash
# Frontend
cd Front-API-main
Remove-Item node_modules -Recurse -Force
npm install

# Backend
cd ..
pip install -r requirements.txt
```

---

## 📝 Notas Importantes

1. **Puerto 8000**: Backend FastAPI
2. **Puerto 5173**: Frontend Vite/React
3. **Primera vez**: Registrar usuario para crear admin
4. **Sin Gemini**: El sistema funciona sin API key (usa fallbacks)
5. **Datos de prueba**: Se crean automáticamente en primera ejecución

---

## ✅ Sistema Funcionando

Cuando todo esté correcto verás:

**Backend:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**Frontend:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Navegador:**
- Pantalla de login visible
- No errores en consola (F12)
- Puede registrar/login usuarios

---

## 🎉 ¡Listo!

El sistema está completamente funcional:
- ✅ Backend FastAPI con IA (Gemini)
- ✅ Frontend React conectado
- ✅ CRUD de espacios
- ✅ Analytics en tiempo real
- ✅ Predicciones con IA
- ✅ Optimización automática

**Última actualización**: Noviembre 2025
