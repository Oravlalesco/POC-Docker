"""
Aplicación Web de Clima en Chile
Backend Flask conectado con Open-Meteo API y Base de Datos SQLite clima_chile.db
"""

from requests import exceptions
import os
import sqlite3
from datetime import datetime
from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)
DB_PATH = os.path.join(os.path.dirname(__file__), 'clima_chile.db')

# Ciudades principales y comunas de Chile preconfiguradas
CIUDADES_CHILE = [
    {"ciudad": "Arica", "region": "Arica y Parinacota", "latitud": -18.4783, "longitud": -70.3126, "zona": "Norte Grande", "timezone": "America/Santiago"},
    {"ciudad": "Iquique", "region": "Tarapacá", "latitud": -20.2133, "longitud": -70.1503, "zona": "Norte Grande", "timezone": "America/Santiago"},
    {"ciudad": "Antofagasta", "region": "Antofagasta", "latitud": -23.6500, "longitud": -70.4000, "zona": "Norte Grande", "timezone": "America/Santiago"},
    {"ciudad": "Calama", "region": "Antofagasta", "latitud": -22.4559, "longitud": -68.9294, "zona": "Norte Grande", "timezone": "America/Santiago"},
    {"ciudad": "San Pedro de Atacama", "region": "Antofagasta", "latitud": -22.9115, "longitud": -68.2015, "zona": "Norte Grande", "timezone": "America/Santiago"},
    {"ciudad": "Copiapó", "region": "Atacama", "latitud": -27.3668, "longitud": -70.3323, "zona": "Norte Chico", "timezone": "America/Santiago"},
    {"ciudad": "La Serena", "region": "Coquimbo", "latitud": -29.9027, "longitud": -71.2519, "zona": "Norte Chico", "timezone": "America/Santiago"},
    {"ciudad": "Coquimbo", "region": "Coquimbo", "latitud": -29.9533, "longitud": -71.3436, "zona": "Norte Chico", "timezone": "America/Santiago"},
    {"ciudad": "Valparaíso", "region": "Valparaíso", "latitud": -33.0472, "longitud": -71.6127, "zona": "Zona Central", "timezone": "America/Santiago"},
    {"ciudad": "Viña del Mar", "region": "Valparaíso", "latitud": -33.0245, "longitud": -71.5518, "zona": "Zona Central", "timezone": "America/Santiago"},
    {"ciudad": "Santiago", "region": "Región Metropolitana", "latitud": -33.4489, "longitud": -70.6693, "zona": "Zona Central", "timezone": "America/Santiago"},
    {"ciudad": "Providencia", "region": "Región Metropolitana", "latitud": -33.4314, "longitud": -70.6093, "zona": "Zona Central", "timezone": "America/Santiago"},
    {"ciudad": "Puente Alto", "region": "Región Metropolitana", "latitud": -33.6117, "longitud": -70.5758, "zona": "Zona Central", "timezone": "America/Santiago"},
    {"ciudad": "Rancagua", "region": "O'Higgins", "latitud": -34.1708, "longitud": -70.7444, "zona": "Zona Central", "timezone": "America/Santiago"},
    {"ciudad": "Talca", "region": "Maule", "latitud": -35.4264, "longitud": -71.6554, "zona": "Zona Central", "timezone": "America/Santiago"},
    {"ciudad": "Chillán", "region": "Ñuble", "latitud": -36.6066, "longitud": -72.1034, "zona": "Zona Centro-Sur", "timezone": "America/Santiago"},
    {"ciudad": "Concepción", "region": "Biobío", "latitud": -36.8270, "longitud": -73.0503, "zona": "Zona Centro-Sur", "timezone": "America/Santiago"},
    {"ciudad": "Los Ángeles", "region": "Biobío", "latitud": -37.4697, "longitud": -72.3537, "zona": "Zona Centro-Sur", "timezone": "America/Santiago"},
    {"ciudad": "Temuco", "region": "La Araucanía", "latitud": -38.7359, "longitud": -72.5904, "zona": "Zona Centro-Sur", "timezone": "America/Santiago"},
    {"ciudad": "Pucón", "region": "La Araucanía", "latitud": -39.2822, "longitud": -71.9744, "zona": "Zona Centro-Sur", "timezone": "America/Santiago"},
    {"ciudad": "Valdivia", "region": "Los Ríos", "latitud": -39.8142, "longitud": -73.2459, "zona": "Zona Sur", "timezone": "America/Santiago"},
    {"ciudad": "Osorno", "region": "Los Lagos", "latitud": -40.5739, "longitud": -73.1335, "zona": "Zona Sur", "timezone": "America/Santiago"},
    {"ciudad": "Puerto Montt", "region": "Los Lagos", "latitud": -41.4693, "longitud": -72.9424, "zona": "Zona Sur", "timezone": "America/Santiago"},
    {"ciudad": "Castro (Chiloé)", "region": "Los Lagos", "latitud": -42.4721, "longitud": -73.7732, "zona": "Zona Sur", "timezone": "America/Santiago"},
    {"ciudad": "Coyhaique", "region": "Aysén", "latitud": -45.5712, "longitud": -72.0685, "zona": "Zona Austral", "timezone": "America/Santiago"},
    {"ciudad": "Punta Arenas", "region": "Magallanes", "latitud": -53.1638, "longitud": -70.9171, "zona": "Zona Austral", "timezone": "America/Punta_Arenas"},
    {"ciudad": "Puerto Williams", "region": "Magallanes", "latitud": -54.9333, "longitud": -67.6167, "zona": "Zona Austral", "timezone": "America/Punta_Arenas"},
    {"ciudad": "Rapa Nui (Isla de Pascua)", "region": "Valparaíso (Insular)", "latitud": -27.1127, "longitud": -109.3497, "zona": "Chile Insular", "timezone": "Pacific/Easter"},
    {"ciudad": "Archipiélago Juan Fernández", "region": "Valparaíso (Insular)", "latitud": -33.6364, "longitud": -78.8322, "zona": "Chile Insular", "timezone": "America/Santiago"}
]
# El significado de los códigos meteorológicos WMO (Organización Meteorológica Mundial) son:
WMO_CODES = {
    0: {"desc": "Despejado", "icon": "☀️", "mood": "sunny"},
    1: {"desc": "Mayormente despejado", "icon": "🌤️", "mood": "mostly-sunny"},
    2: {"desc": "Parcialmente nublado", "icon": "⛅", "mood": "partly-cloudy"},
    3: {"desc": "Nublado", "icon": "☁️", "mood": "cloudy"},
    45: {"desc": "Neblina / Camanchaca", "icon": "🌫️", "mood": "fog"},
    48: {"desc": "Niebla con escarcha", "icon": "🌫️", "mood": "fog"},
    51: {"desc": "Llovizna ligera", "icon": "🌦️", "mood": "rain"},
    53: {"desc": "Llovizna moderada", "icon": "🌦️", "mood": "rain"},
    55: {"desc": "Llovizna densa", "icon": "🌧️", "mood": "rain"},
    56: {"desc": "Llovizna helada ligera", "icon": "🌧️", "mood": "rain"},
    57: {"desc": "Llovizna helada densa", "icon": "🌧️", "mood": "rain"},
    61: {"desc": "Lluvia débil", "icon": "🌧️", "mood": "rain"},
    63: {"desc": "Lluvia moderada", "icon": "🌧️", "mood": "rain"},
    65: {"desc": "Lluvia fuerte", "icon": "🌧️", "mood": "heavy-rain"},
    66: {"desc": "Lluvia helada ligera", "icon": "🌨️", "mood": "snow"},
    67: {"desc": "Lluvia helada intensa", "icon": "🌨️", "mood": "snow"},
    71: {"desc": "Nevada ligera", "icon": "🌨️", "mood": "snow"},
    73: {"desc": "Nevada moderada", "icon": "❄️", "mood": "snow"},
    75: {"desc": "Nevada intensa", "icon": "❄️", "mood": "snow"},
    77: {"desc": "Granizo menudo", "icon": "🌨️", "mood": "snow"},
    80: {"desc": "Chubascos ligeros", "icon": "🌦️", "mood": "rain"},
    81: {"desc": "Chubascos moderados", "icon": "🌧️", "mood": "rain"},
    82: {"desc": "Chubascos violentos", "icon": "⛈️", "mood": "heavy-rain"},
    85: {"desc": "Chubascos de nieve débiles", "icon": "🌨️", "mood": "snow"},
    86: {"desc": "Chubascos de nieve fuertes", "icon": "❄️", "mood": "snow"},
    95: {"desc": "Tormenta eléctrica", "icon": "⛈️", "mood": "storm"},
    96: {"desc": "Tormenta con granizo leve", "icon": "⛈️", "mood": "storm"},
    99: {"desc": "Tormenta con granizo fuerte", "icon": "⛈️", "mood": "storm"}
}


def get_db():
    try:
        con = sqlite3.connect(DB_PATH)
        con.row_factory = sqlite3.Row
        return con
    except sqlite3.Error as e:
        print(f"Error al conectar con la base de datos: {e}")
        return None


def init_db():
    conn = get_db()
    if conn is None:
        print("Error al conectar con la base de datos, no se puede inicializar")
        return
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS rol (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT UNIQUE NOT NULL,
                descripcion TEXT,
                activo INTEGER DEFAULT 1
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                rol_id INTEGER NOT NULL,
                activo INTEGER DEFAULT 1,
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (rol_id) REFERENCES rol (id) ON DELETE RESTRICT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS favoritos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ciudad TEXT NOT NULL,
                region TEXT NOT NULL,
                latitud REAL NOT NULL,
                longitud REAL NOT NULL,
                orden INTEGER DEFAULT 0,
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS historial_consultas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ciudad TEXT NOT NULL,
                region TEXT,
                temperatura REAL,
                sensacion_termica REAL,
                condicion TEXT,
                humedad INTEGER,
                viento_kmh REAL,
                indice_uv REAL,
                consultado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Si no hay favoritos, sembramos las principales ciudades de Chile
        count = conn.execute("SELECT COUNT(*) FROM favoritos").fetchone()[0]
        if count == 0:
            defaults = [
                ("Santiago", "Región Metropolitana", -33.4489, -70.6693, 1),
                ("Valparaíso", "Valparaíso", -33.0472, -71.6127, 2),
                ("Concepción", "Biobío", -36.8270, -73.0503, 3),
                ("Puerto Montt", "Los Lagos", -41.4693, -72.9424, 4),
                ("Punta Arenas", "Magallanes", -53.1638, -70.9171, 5),
                ("Rapa Nui", "Valparaíso (Insular)", -27.1127, -109.3497, 6)
            ]
            conn.executemany(
                "INSERT INTO favoritos (ciudad, region, latitud, longitud, orden) VALUES (?, ?, ?, ?, ?)",
                defaults
            )
    conn.close()


init_db()


def degree_to_cardinal(deg):
    """
    Convierte grados a dirección cardinal
    :param deg: Dirección en grados
    :return: Dirección cardinal
    """
    if deg is None:
        return "N/D"
    val = int((deg / 22.5) + .5)
    arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
           "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    return arr[(val % 16)]


def get_uv_category(uv):
    """
    Convierte el índice UV a categoría y recomendación
    :param uv: Índice UV
    :return: Diccionario con nivel, color y recomendación
    """
    if uv is None:
        return {"nivel": "N/D", "color": "#94a3b8", "recomendacion": "Sin datos"}
    if uv < 3:
        return {"nivel": "Bajo", "color": "#10b981", "recomendacion": "No se requiere protección especial."}
    elif uv < 6:
        return {"nivel": "Moderado", "color": "#f59e0b", "recomendacion": "Usa protector solar SPF 30+ y sombrero."}
    elif uv < 8:
        return {"nivel": "Alto", "color": "#f97316", "recomendacion": "Evita exposición directa al mediodía."}
    elif uv < 11:
        return {"nivel": "Muy Alto", "color": "#ef4444", "recomendacion": "Protección máxima: gafas con filtro UV y sombra."}
    else:
        return {"nivel": "Extremo", "color": "#a855f7", "recomendacion": "¡Peligro! Evita salir al sol si es posible."}


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/weather')
def get_weather():
    try:
        lat = float(request.args.get('lat', -33.4489))
        lon = float(request.args.get('lon', -70.6693))
        ciudad = request.args.get('ciudad', 'Santiago')
        region = request.args.get('region', 'Región Metropolitana')
        timezone = request.args.get('timezone', 'America/Santiago')

        # Consultar Open-Meteo API
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index",
            "hourly": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,uv_index,wind_speed_10m",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
            "timezone": timezone,
            "forecast_days": 7
        }

        resp = requests.get(url, params=params, timeout=12)
        resp.raise_for_status()
        data = resp.json()

        current = data.get('current', {})
        wcode = current.get('weather_code', 0)
        wmo_info = WMO_CODES.get(wcode, {"desc": "Parcialmente nublado", "icon": "⛅", "mood": "cloudy"})
        uv = current.get('uv_index', 0.0)
        uv_info = get_uv_category(uv)
        wind_dir = degree_to_cardinal(current.get('wind_direction_10m'))

        # Procesar pronóstico por horas (próximas 24 horas a partir de ahora)
        hourly_data = data.get('hourly', {})
        times = hourly_data.get('time', [])
        temps = hourly_data.get('temperature_2m', [])
        codes = hourly_data.get('weather_code', [])
        rain_probs = hourly_data.get('precipitation_probability', [])
        winds = hourly_data.get('wind_speed_10m', [])

        current_time_str = current.get('time', '')
        start_idx = 0
        if current_time_str in times:
            start_idx = times.index(current_time_str)

        hourly_forecast = []
        for i in range(start_idx, min(start_idx + 24, len(times))):
            h_code = codes[i] if i < len(codes) else 0
            h_info = WMO_CODES.get(h_code, {"desc": "Variable", "icon": "🌤️", "mood": "mostly-sunny"})
            # Formatear hora: "2026-10-17T19:00" -> "19:00"
            raw_time = times[i]
            hour_label = raw_time.split('T')[1][:5] if 'T' in raw_time else raw_time
            hourly_forecast.append({
                "time": hour_label,
                "full_time": raw_time,
                "temp": round(temps[i], 1) if i < len(temps) else 0,
                "code": h_code,
                "desc": h_info["desc"],
                "icon": h_info["icon"],
                "rain_prob": rain_probs[i] if i < len(rain_probs) else 0,
                "wind": round(winds[i], 1) if i < len(winds) else 0
            })

        # Procesar pronóstico diario (7 días)
        daily_data = data.get('daily', {})
        d_times = daily_data.get('time', [])
        d_codes = daily_data.get('weather_code', [])
        d_max = daily_data.get('temperature_2m_max', [])
        d_min = daily_data.get('temperature_2m_min', [])
        d_rain_prob = daily_data.get('precipitation_probability_max', [])
        d_rain_sum = daily_data.get('precipitation_sum', [])
        d_uv = daily_data.get('uv_index_max', [])
        d_sunrise = daily_data.get('sunrise', [])
        d_sunset = daily_data.get('sunset', [])

        daily_forecast = []
        dias_es = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

        for j in range(len(d_times)):
            day_str = d_times[j]
            try:
                dt = datetime.strptime(day_str, '%Y-%m-%d')
                day_name = "Hoy" if j == 0 else dias_es[dt.weekday()]
                day_formatted = dt.strftime('%d/%m')
            except Exception:
                day_name = day_str
                day_formatted = ""

            dj_code = d_codes[j] if j < len(d_codes) else 0
            dj_info = WMO_CODES.get(dj_code, {"desc": "Variable", "icon": "🌤️", "mood": "mostly-sunny"})

            daily_forecast.append({
                "date": day_str,
                "day_name": day_name,
                "day_formatted": day_formatted,
                "icon": dj_info["icon"],
                "desc": dj_info["desc"],
                "temp_max": round(d_max[j], 1) if j < len(d_max) else 0,
                "temp_min": round(d_min[j], 1) if j < len(d_min) else 0,
                "rain_prob": d_rain_prob[j] if j < len(d_rain_prob) else 0,
                "rain_sum": round(d_rain_sum[j], 1) if j < len(d_rain_sum) else 0,
                "uv_max": d_uv[j] if j < len(d_uv) else 0,
                "sunrise": d_sunrise[j].split('T')[1][:5] if j < len(d_sunrise) and 'T' in d_sunrise[j] else "",
                "sunset": d_sunset[j].split('T')[1][:5] if j < len(d_sunset) and 'T' in d_sunset[j] else ""
            })

        # Registrar consulta en historial_consultas de la base de datos
        try:
            conn = get_db()
            with conn:
                conn.execute("""
                    INSERT INTO historial_consultas 
                    (ciudad, region, temperatura, sensacion_termica, condicion, humedad, viento_kmh, indice_uv)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    ciudad,
                    region,
                    current.get('temperature_2m'),
                    current.get('apparent_temperature'),
                    wmo_info['desc'],
                    current.get('relative_humidity_2m'),
                    current.get('wind_speed_10m'),
                    uv
                ))
            conn.close()
        except Exception as db_err:
            print(f"Error guardando historial: {db_err}")

        # Retornar respuesta estructurada
        return jsonify({
            "ok": True,
            "location": {
                "ciudad": ciudad,
                "region": region,
                "latitud": lat,
                "longitud": lon,
                "timezone": timezone
            },
            "current": {
                "temperatura": round(current.get('temperature_2m', 0), 1),
                "sensacion_termica": round(current.get('apparent_temperature', 0), 1),
                "humedad": current.get('relative_humidity_2m', 0),
                "viento_kmh": round(current.get('wind_speed_10m', 0), 1),
                "viento_dir": wind_dir,
                "viento_grados": current.get('wind_direction_10m', 0),
                "presion_hpa": round(current.get('surface_pressure', 1013), 1),
                "precipitacion_mm": current.get('precipitation', 0.0),
                "uv_index": uv,
                "uv_categoria": uv_info,
                "es_de_dia": current.get('is_day', 1) == 1,
                "condicion": wmo_info['desc'],
                "icono": wmo_info['icon'],
                "mood": wmo_info['mood'],
                "hora_reporte": current.get('time', '')
            },
            "hourly": hourly_forecast,
            "daily": daily_forecast
        })

    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route('/api/favorites', methods=['GET', 'POST'])
def handle_favorites():
    conn = get_db()
    if request.method == 'GET':
        rows = conn.execute("SELECT id, ciudad, region, latitud, longitud, orden, creado_en FROM favoritos ORDER BY orden ASC, id ASC").fetchall()
        favorites = [dict(row) for row in rows]
        conn.close()
        return jsonify({"ok": True, "favorites": favorites})

    elif request.method == 'POST':
        data = request.get_json() or {}
        ciudad = data.get('ciudad')
        region = data.get('region', 'Chile')
        lat = data.get('latitud')
        lon = data.get('longitud')

        if not ciudad or lat is None or lon is None:
            conn.close()
            return jsonify({"ok": False, "error": "Faltan parámetros requeridos (ciudad, latitud, longitud)"}), 400

        with conn:
            # Comprobar si ya existe
            existing = conn.execute("SELECT id FROM favoritos WHERE ciudad = ?", (ciudad,)).fetchone()
            if existing:
                conn.close()
                return jsonify({"ok": True, "id": existing['id'], "message": "Ya estaba en favoritos"})

            cursor = conn.execute(
                "INSERT INTO favoritos (ciudad, region, latitud, longitud) VALUES (?, ?, ?, ?)",
                (ciudad, region, float(lat), float(lon))
            )
            new_id = cursor.lastrowid
        conn.close()
        return jsonify({"ok": True, "id": new_id, "message": "Favorito guardado exitosamente"})


@app.route('/api/favorites/<int:fav_id>', methods=['DELETE'])
def delete_favorite(fav_id):
    conn = get_db()
    with conn:
        conn.execute("DELETE FROM favoritos WHERE id = ?", (fav_id,))
    conn.close()
    return jsonify({"ok": True, "message": f"Favorito {fav_id} eliminado"})


@app.route('/api/history', methods=['GET', 'DELETE'])
def handle_history():
    conn = get_db()
    if request.method == 'GET':
        rows = conn.execute("""
            SELECT id, ciudad, region, temperatura, sensacion_termica, condicion, humedad, viento_kmh, indice_uv, consultado_en 
            FROM historial_consultas 
            ORDER BY id DESC 
            LIMIT 20
        """).fetchall()
        history = [dict(row) for row in rows]
        conn.close()
        return jsonify({"ok": True, "history": history})

    elif request.method == 'DELETE':
        with conn:
            conn.execute("DELETE FROM historial_consultas")
        conn.close()
        return jsonify({"ok": True, "message": "Historial limpiado"})


@app.route('/api/search')
def search_cities():
    query = request.args.get('q', '').strip().lower()
    if not query or len(query) < 2:
        return jsonify({"ok": True, "results": []})

    # 1. Búsqueda local en catálogo chileno
    local_matches = []
    for item in CIUDADES_CHILE:
        if query in item['ciudad'].lower() or query in item['region'].lower():
            local_matches.append({
                "ciudad": item['ciudad'],
                "region": item['region'],
                "latitud": item['latitud'],
                "longitud": item['longitud'],
                "timezone": item['timezone'],
                "pais": "Chile",
                "origen": "local"
            })

    # 2. Si hay menos de 5 resultados locales, consultar Geocoding Open-Meteo
    remote_matches = []
    try:
        geo_url = "https://geocoding-api.open-meteo.com/v1/search"
        resp = requests.get(geo_url, params={"name": query, "count": 6, "language": "es", "format": "json"}, timeout=5)
        if resp.status_code == 200:
            raw_results = resp.json().get('results', [])
            for res in raw_results:
                # Priorizar Chile
                is_chile = res.get('country_code') == 'CL' or res.get('country') == 'Chile'
                if is_chile:
                    # Evitar duplicados con catálogo local
                    name = res.get('name')
                    if not any(m['ciudad'].lower() == name.lower() for m in local_matches):
                        remote_matches.append({
                            "ciudad": name,
                            "region": res.get('admin1', 'Chile'),
                            "latitud": res.get('latitude'),
                            "longitud": res.get('longitude'),
                            "timezone": res.get('timezone', 'America/Santiago'),
                            "pais": "Chile",
                            "origen": "geocoding"
                        })
    except Exception as e:
        print(f"Error en geocoding: {e}")

    results = (local_matches + remote_matches)[:10]
    return jsonify({"ok": True, "results": results})


@app.route('/api/regions')
def get_regions():
    return jsonify({"ok": True, "cities": CIUDADES_CHILE})


@app.route('/api/status')
def status():
    return jsonify({"ok": True, "status": "running", "service": "MeteoChile App", "timestamp": datetime.now().isoformat()})


if __name__ == '__main__':
    # Ejecución local en venv
    port = int(os.environ.get('PORT', 5000))
    print(f"\n=======================================================")
    print(f" Servidor de Clima Chile iniciado en http://127.0.0.1:{port}")
    print(f" Entorno: venv (sin contenedor)")
    print(f"=======================================================\n")
    app.run(host='127.0.0.1', port=port, debug=True)
