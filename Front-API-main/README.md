# Space Management System - Frontend

Sistema de gestión de espacios educativos con IA integrada, construido con React + TypeScript + Vite.

## 🚀 Características

### Gestión de Espacios
- ✅ Crear, editar y eliminar espacios
- ✅ Búsqueda y filtrado por tipo
- ✅ Gestión de disponibilidad
- ✅ Imágenes y características de espacios

### Inteligencia Artificial (Gemini AI)
- 🤖 **Predicciones de uso**: Predice patrones de uso futuro
- 🎯 **Optimización automática**: Recomendaciones para mejorar asignaciones
- 📊 **Análisis de patrones**: Detecta tendencias y anomalías
- 🔮 **Simulación de escenarios**: Evalúa impacto de cambios

### Analytics y Reportes
- 📈 Métricas de utilización
- 📊 Análisis de eficiencia
- 📉 Tendencias de uso
- 🔔 Notificaciones en tiempo real

### Autenticación y Seguridad
- 🔐 Login con JWT tokens
- 🔄 Refresh token automático
- 👥 Roles de usuario (admin, docente, estudiante)
- 🛡️ Protección de rutas

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Backend FastAPI corriendo en `http://localhost:8000`

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
cd Front-API-main
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_VERSION=v1
```

4. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview de build
npm run preview

# Lint
npm run lint
```

## 📁 Estructura del Proyecto

```
Front-API-main/
├── src/
│   ├── components/          # Componentes React
│   │   ├── AI/             # Componentes de IA
│   │   ├── Auth/           # Autenticación
│   │   ├── Dashboard/      # Dashboard principal
│   │   ├── Spaces/         # Gestión de espacios
│   │   ├── User/           # Gestión de usuarios
│   │   └── common/         # Componentes comunes
│   ├── context/            # Context API (State management)
│   │   ├── AuthContext.tsx
│   │   ├── SpaceContext.tsx
│   │   └── AIContext.tsx
│   ├── services/           # Servicios API
│   │   ├── apiClient.ts       # Cliente HTTP base
│   │   ├── authService.ts     # Autenticación
│   │   ├── spaceService.ts    # Espacios
│   │   ├── aiService.ts       # IA y predicciones
│   │   ├── analyticsService.ts # Analytics
│   │   ├── assignmentService.ts # Asignaciones
│   │   ├── resourceService.ts  # Recursos
│   │   └── notificationService.ts # Notificaciones
│   ├── types/              # TypeScript types
│   ├── utils/              # Utilidades
│   ├── App.tsx             # Componente principal
│   └── main.tsx            # Entry point
├── .env                    # Variables de entorno
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🔌 API Endpoints Utilizados

### Autenticación
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Registro
- `GET /api/v1/auth/me` - Perfil del usuario
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout

### Espacios
- `GET /api/v1/spaces` - Listar espacios
- `GET /api/v1/spaces/{id}` - Obtener espacio
- `POST /api/v1/spaces` - Crear espacio
- `PUT /api/v1/spaces/{id}` - Actualizar espacio
- `DELETE /api/v1/spaces/{id}` - Eliminar espacio
- `GET /api/v1/spaces/available` - Espacios disponibles

### Recursos
- `GET /api/v1/resources` - Listar recursos
- `POST /api/v1/resources` - Crear recurso
- `PUT /api/v1/resources/{id}` - Actualizar recurso
- `DELETE /api/v1/resources/{id}` - Eliminar recurso

### Asignaciones
- `GET /api/v1/assignments` - Listar asignaciones
- `GET /api/v1/assignments/active` - Asignaciones activas
- `POST /api/v1/assignments` - Crear asignación
- `PUT /api/v1/assignments/{id}` - Actualizar asignación
- `DELETE /api/v1/assignments/{id}` - Eliminar asignación

### Analytics e IA
- `POST /api/v1/analytics/predictions` - Generar predicciones con IA
- `POST /api/v1/assignments/optimize` - Optimizar asignaciones con IA
- `POST /api/v1/analytics/usage-patterns` - Analizar patrones de uso
- `POST /api/v1/analytics/simulate` - Simular escenarios
- `GET /api/v1/analytics/usage` - Métricas de uso
- `GET /api/v1/analytics/efficiency` - Métricas de eficiencia

### Notificaciones
- `GET /api/v1/notifications` - Listar notificaciones
- `GET /api/v1/notifications/unread` - No leídas
- `PUT /api/v1/notifications/{id}/read` - Marcar como leída

## 🤖 Integración con IA

El frontend se conecta con Google Gemini AI a través del backend FastAPI:

### 1. Predicciones de Uso
```typescript
import { aiService } from './services';

const predictions = await aiService.generatePredictions({
  data: {
    spaces: currentSpaces,
    query: "predecir uso próxima semana"
  }
});
```

### 2. Optimización de Espacios
```typescript
const optimization = await aiService.optimizeSpaceAllocation({
  spaces: allSpaces,
  resources: allResources
});

// Retorna score y recomendaciones específicas
```

### 3. Análisis de Patrones
```typescript
const patterns = await aiService.analyzeUsagePatterns({
  usage_data: historicalData
});

// Detecta tendencias, anomalías y da recomendaciones
```

### 4. Simulación de Escenarios
```typescript
const simulation = await aiService.simulateScenario({
  scenario: {
    description: "Aumentar capacidad en 20%",
    changes: { capacidad: "+20%" }
  }
});

// Evalúa viabilidad, riesgos y beneficios
```

## 🎨 Tecnologías Utilizadas

- **React 18** - UI Library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Lucide React** - Icons
- **Context API** - State management

## 🔐 Autenticación

El sistema usa JWT tokens con refresh automático:

1. Usuario inicia sesión → Recibe `access_token` y `refresh_token`
2. `access_token` se incluye en todas las requests
3. Si `access_token` expira → Se usa `refresh_token` automáticamente
4. Si `refresh_token` expira → Usuario debe iniciar sesión nuevamente

Los tokens se almacenan en `localStorage`.

## 📱 Uso de la Aplicación

### Primera Vez

1. **Registrar usuario**
   - Ir a pantalla de registro
   - Ingresar nombre, email, password
   - Primer usuario registrado es admin automáticamente

2. **Iniciar sesión**
   - Email: tu@email.com (o username antes del @)
   - Password: tu contraseña

3. **Crear espacios**
   - Dashboard → Spaces → Add Space
   - Completar formulario
   - Los espacios se sincronizan con el backend

4. **Usar funcionalidades de IA**
   - Dashboard → AI Analytics
   - Generar predicciones
   - Ver recomendaciones de optimización
   - Analizar patrones de uso

## 🐛 Troubleshooting

### Error de conexión con API

**Problema**: `Network Error` o `ERR_CONNECTION_REFUSED`

**Solución**:
1. Verificar que el backend esté corriendo en `http://localhost:8000`
2. Verificar `.env` tenga la URL correcta
3. Verificar CORS habilitado en FastAPI

### Token inválido

**Problema**: `401 Unauthorized` constante

**Solución**:
1. Limpiar localStorage: `localStorage.clear()`
2. Iniciar sesión nuevamente
3. Verificar que el backend acepte el token

### IA no funciona

**Problema**: Las funciones de IA fallan

**Solución**:
1. Verificar que `GEMINI_API_KEY` esté configurada en el backend
2. Verificar que hay cuota disponible en Gemini
3. Ver logs del backend para más detalles
4. El frontend tiene fallbacks locales si la IA falla

## 📚 Documentación Adicional

- [Backend API Documentation](../AI_IMPLEMENTATION.md)
- [Gemini AI Integration](../GEMINI_VERIFICATION.md)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)

## 🤝 Contribuir

1. Fork el proyecto
2. Crear branch de feature (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto es parte de una tesis académica.

## 👥 Autores

- Desarrollado como parte del proyecto de tesis
- Backend FastAPI con Gemini AI
- Frontend React + TypeScript

## 📞 Soporte

Para problemas o preguntas:
1. Revisar esta documentación
2. Revisar logs del navegador (F12 → Console)
3. Revisar logs del backend FastAPI
4. Verificar configuración de API keys

---

**Última actualización**: Noviembre 2025
