# 🇨🇱 ClimaChile - Aplicación Web Meteorológica en Vivo

Aplicación web desarrollada con **HTML5, Vanilla CSS y JavaScript**, conectada con la API meteorológica de **Open-Meteo** (sin límites ni claves requeridas) y un servidor backend ligero en **Python Flask** ejecutado mediante un entorno virtual (`venv`), persistiendo datos en SQLite local (`clima_chile.db`).

---

## 🚀 Características Principales

1. **Datos en Tiempo Real para Todo Chile**:
   - Temperatura actual, sensación térmica, humedad relativa, presión superficial y precipitación.
   - Viento con velocidad y rosa de los vientos (brújula animada con dirección cardinal: N, S, E, O, etc.).
   - Amanecer y atardecer según huso horario chileno.

2. **Índice UV y Recomendaciones de Salud (MINSAL Chile)**:
   - Medidor visual dinámico con escala de 0 a 11+ (Bajo, Moderado, Alto, Muy Alto, Extremo).
   - Consejos médicos de fotoprotección y radiación solar ajustados a los estándares de Chile.

3. **Pronóstico Extendido**:
   - **Próximas 24 horas**: Slider horizontal interactivo con temperatura, probabilidad de lluvia y viento por hora.
   - **7 días**: Tarjetas con temperaturas mínimas y máximas (barra de rango térmico), condiciones y probabilidades de lluvia.

4. **Relojes Oficiales de Chile**:
   - Hora oficial para **Chile Continental** (`America/Santiago`, UTC-3).
   - Hora para la **Región de Magallanes y Antártica** (`America/Punta_Arenas`, UTC-3).
   - Hora para **Chile Insular / Rapa Nui** (`Pacific/Easter`, UTC-5).

5. **Búsqueda y Acceso Rápido**:
   - Acceso con un clic a capitales regionales y zonas: Santiago, Valparaíso, Concepción, La Serena, Puerto Montt, Punta Arenas, San Pedro de Atacama, Rapa Nui.
   - Buscador con autocompletado en vivo para comunas y localidades de Chile.
   - Botón de **"📍 Mi Ubicación"** con geolocalización de coordenadas del navegador.

6. **Integración con Base de Datos SQLite (`clima_chile.db`)**:
   - **Favoritos (`favoritos`)**: Guarda y quita ciudades favoritas con la estrella ⭐ directamente sincronizadas con la base de datos.
   - **Historial (`historial_consultas`)**: Cada consulta registra automáticamente la temperatura, humedad, viento y condición.

7. **Diseño Visual de Alta Gama**:
   - Estética Glassmorphism con modo oscuro, orbes de luz dinámica según el clima (soleado, nublado, lluvioso, nieve, tormenta), micro-animaciones y tipografías Outfit y JetBrains Mono.

---

## 🛠️ Estructura del Proyecto Desacoplado

```text
Docker/
├── backend/                       # Servidor API REST y Base de Datos
│   ├── app.py                     # Servidor Flask y endpoints REST con CORS
│   ├── clima_chile.db             # Base de datos SQLite (favoritos, historial)
│   ├── requirements.txt           # Dependencias Python (Flask, requests, flask-cors)
│   ├── Dockerfile                 # Imagen Docker de Backend (Python 3.11-slim)
│   ├── .dockerignore              # Exclusiones de contexto Docker
│   └── iniciar_backend.bat        # Script de ejecución individual del backend
│
├── frontend/                      # Cliente web estático (HTML, CSS, JS)
│   ├── index.html                 # Estructura semántica HTML5
│   ├── css/
│   │   └── styles.css             # Diseño Vanilla CSS moderno y glassmorphism
│   ├── js/
│   │   └── app.js                 # Lógica interactiva Vanilla JS conectada a la API
│   ├── nginx.conf                 # Configuración de Nginx y proxy inverso
│   ├── Dockerfile                 # Imagen Docker de Frontend (Nginx Alpine)
│   ├── .dockerignore              # Exclusiones de contexto Docker
│   └── iniciar_frontend.bat       # Script de ejecución individual del frontend
│
├── iniciar.bat                    # Script unificado de inicio rápido en Windows
├── docker-compose.yml             # Orquestación de contenedores (Frontend + Backend)
├── CHANGELOG.md                   # Historial oficial de cambios y versiones
├── README.md                      # Documentación del proyecto
└── venv/                          # Entorno virtual de Python compartido
```

---

## ⚡ Cómo Ejecutar la Aplicación

### Opción 1: Ejecución completa con el script automático (Recomendado)
Haz doble clic en:
```text
iniciar.bat
```
Este script abre automáticamente el cliente en tu navegador (`frontend/index.html`) e inicia el servidor API en segundo plano en `http://127.0.0.1:5000`.

### Opción 2: Ejecución individual por carpetas

#### 1. Iniciar el Backend (API Flask)
- Mediante script: doble clic en `backend/iniciar_backend.bat`
- O desde la terminal:
  ```powershell
  cd backend
  ..\venv\Scripts\python.exe app.py
  ```
  La API estará disponible en `http://127.0.0.1:5000`.

#### 2. Iniciar el Frontend
- Doble clic en `frontend/index.html` para abrirlo directamente en el navegador.
- O mediante servidor local HTTP:
  ```powershell
  cd frontend
  python -m http.server 3000
  ```
  Y abrir en tu navegador: `http://localhost:3000`.

### Opción 3: Ejecución con Docker Compose (Recomendado)

Con Docker Compose levantas toda la arquitectura (red, backend, frontend y persistencia de base de datos) con un único comando:

#### 1. Iniciar toda la infraestructura (construye y levanta en segundo plano)
```powershell
docker compose up --build -d
```

#### 2. Verificar el estado de los contenedores
```powershell
docker compose ps
```

#### 3. Ver los logs combinados en tiempo real
```powershell
docker compose logs -f
```

#### 4. Acceder a la aplicación
- **Frontend Web**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

#### 5. Detener y limpiar todo
```powershell
docker compose down
```

---

### Opción 4: Ejecución manual con Docker CLI (Sin Compose)

Si prefieres controlar cada contenedor manualmente por separado:

#### 1. Crear red de Docker
```powershell
docker network create climachile-net
```

#### 2. Construir y correr el contenedor Backend
```powershell
docker build -t climachile-backend ./backend
docker run -d --name climachile-backend --network climachile-net -p 5000:5000 climachile-backend
```

#### 3. Construir y correr el contenedor Frontend
```powershell
docker build -t climachile-frontend ./frontend
docker run -d --name climachile-frontend --network climachile-net -p 3000:80 climachile-frontend
```

#### 4. Detener y limpiar los contenedores
```powershell
docker stop climachile-frontend climachile-backend
docker rm climachile-frontend climachile-backend
docker network rm climachile-net
```

---

## 🌐 Endpoints de la API Backend

- `GET /`: Estado general del backend e información de rutas.
- `GET /api/weather?lat={lat}&lon={lon}&ciudad={ciudad}&region={region}`: Datos meteorológicos actuales, pronóstico por horas (24h) y diario (7 días).
- `GET /api/search?q={nombre}`: Búsqueda y autocompletado de comunas y ciudades de Chile.
- `GET /api/favorites`: Listado de ciudades favoritas almacenadas en SQLite.
- `POST /api/favorites`: Guarda una nueva ciudad favorita en SQLite.
- `DELETE /api/favorites/<id>`: Elimina un favorito de SQLite.
- `GET /api/history`: Últimas 20 consultas registradas.
- `DELETE /api/history`: Limpia el historial de consultas.
- `GET /api/status`: Estado de operatividad del servicio.
