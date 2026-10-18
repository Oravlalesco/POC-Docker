# Changelog (Registro de Cambios)

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [0.3.0] - 2026-10-18

### Añadido
- **Contenedorización Backend**:
  - `backend/Dockerfile` basado en `python:3.11-slim` con usuario no-root `appuser` (UID 1000) para máxima seguridad.
  - Variables de entorno `PYTHONDONTWRITEBYTECODE=1` y `PYTHONUNBUFFERED=1` para evitar archivos temporales y permitir logs en tiempo real.
  - `backend/.dockerignore` para excluir entornos virtuales, archivos `.pyc` y cachés.
- **Contenedorización Frontend**:
  - `frontend/Dockerfile` basado en `nginx:alpine` para servir estáticos con alto rendimiento.
  - `frontend/nginx.conf` personalizado con configuración de proxy inverso hacia el backend (`http://climachile-backend:5000/api/`) y cabeceras de caché.
  - `frontend/.dockerignore` para optimizar el contexto de construcción.
- **Orquestación con Docker Compose**:
  - `docker-compose.yml` en la raíz del proyecto para levantar el stack completo con un solo comando.
  - Red privada tipo bridge `climachile-net` con resolución DNS automática y alias (`backend`, `climachile-backend`).
  - Persistencia de base de datos SQLite montando el volumen `./backend/clima_chile.db:/app/clima_chile.db`.
  - Dependencia declarada `depends_on: [backend]` para garantizar el orden de encendido correcto.
- **Documentación**:
  - Instrucciones completas en `README.md` para ejecución mediante `docker compose` y comandos directos de `docker` CLI.
  - Registro de cambios oficial `CHANGELOG.md`.

### Modificado
- `backend/app.py`:
  - Soporte de configuración de host (`HOST`) y modo de depuración (`FLASK_DEBUG`) mediante variables de entorno, permitiendo escuchar en `0.0.0.0` dentro del contenedor.

---

## [0.2.0] - 2026-10-18

### Añadido
- Soporte para **CORS** (*Cross-Origin Resource Sharing*) en `backend/app.py` mediante cabeceras `Access-Control-Allow-*` para permitir peticiones de orígenes cruzados.
- Scripts de ejecución por componente:
  - `backend/iniciar_backend.bat` para iniciar la API en el puerto 5000.
  - `frontend/iniciar_frontend.bat` para servir los estáticos en el puerto 3000.

### Modificado
- Desacoplamiento estructural del monolito:
  - Reubicación de la API Flask y base de datos SQLite en el directorio `/backend`.
  - Reubicación de la interfaz web (`index.html`, `styles.css`, `app.js`) en el directorio `/frontend`.
- `frontend/js/app.js`: Adaptado para consultar endpoints REST independientes mediante URL base configurable (`API_BASE`).

---

## [0.1.0] - 2026-10-17

### Añadido
- Aplicación web meteorológica en tiempo real para Chile:
  - Integración con la API pública de **Open-Meteo** (temperatura, sensación térmica, viento, humedad, precipitación, índice UV y pronóstico a 7 días).
  - Consulta meteorológica para 24+ ciudades y comunas preconfiguradas de Chile, incluyendo Chile Insular (Rapa Nui).
  - Relojes oficiales para tres husos horarios de Chile (Continental, Magallanes e Insular).
  - Buscador predictivo con autocompletado en vivo de localidades.
  - Persistencia de ciudades favoritas e historial de consultas mediante base de datos SQLite local (`clima_chile.db`).
- Interfaz de usuario moderna:
  - Diseño Glassmorphism con modo oscuro, orbes dinámicos y micro-animaciones.
  - Tipografías modernas (*Outfit* y *JetBrains Mono*).
- Script de inicio rápido `iniciar.bat`.
