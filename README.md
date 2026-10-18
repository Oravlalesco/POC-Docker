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

## 🛠️ Estructura del Proyecto

```text
Docker/
├── app.py                     # Servidor Flask y endpoints REST
├── clima_chile.db             # Base de datos SQLite (favoritos, historial, roles)
├── requirements.txt           # Dependencias de Python (Flask, requests)
├── iniciar.bat                # Script de inicio rápido en Windows
├── templates/
│   └── index.html             # Estructura semántica HTML5
├── static/
│   ├── css/
│   │   └── styles.css         # Diseño Vanilla CSS moderno
│   └── js/
│       └── app.js             # Lógica interactiva Vanilla JS
└── venv/                      # Entorno virtual de Python
```

---

## ⚡ Cómo Ejecutar la Aplicación

### Opción 1: Ejecución con el script automático (Windows)
Haz doble clic en:
```text
iniciar.bat
```

### Opción 2: Ejecución desde la terminal (PowerShell o CMD)
1. Activar el entorno virtual o usar el ejecutable directo de `venv`:
   ```powershell
   .\venv\Scripts\python.exe app.py
   ```
2. Abrir en cualquier navegador web:
   ```text
   http://127.0.0.1:5000
   ```

---

## 🌐 Endpoints de la API Backend

- `GET /`: Interfaz web interactiva.
- `GET /api/weather?lat={lat}&lon={lon}&ciudad={ciudad}&region={region}`: Datos meteorológicos actuales, pronóstico por horas (24h) y diario (7 días).
- `GET /api/search?q={nombre}`: Búsqueda y autocompletado de comunas y ciudades de Chile.
- `GET /api/favorites`: Listado de ciudades favoritas almacenadas en la base de datos.
- `POST /api/favorites`: Guarda una nueva ciudad favorita en SQLite.
- `DELETE /api/favorites/<id>`: Elimina un favorito de SQLite.
- `GET /api/history`: Últimas 20 consultas registradas.
- `DELETE /api/history`: Limpia el historial de consultas.
- `GET /api/status`: Estado de operatividad del servicio.
