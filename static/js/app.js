/**
 * ClimaChile - Lógica Principal de Frontend (Vanilla JavaScript)
 * Conexión con Backend Flask, Open-Meteo API y SQLite local
 */

(function () {
  'use strict';

  // ==========================================
  // ESTADO DE LA APLICACIÓN
  // ==========================================
  const state = {
    city: 'Santiago',
    region: 'Región Metropolitana',
    lat: -33.4489,
    lon: -70.6693,
    timezone: 'America/Santiago',
    unit: 'C', // 'C' o 'F'
    weatherData: null, // datos de la API de Open-Meteo
    favorites: [], // lista de ciudades favoritas
    searchDebounceTimer: null // temporizador para debounce de búsqueda
  };

  // ==========================================
  // SELECTORES DEL DOM (Documento Objeto Modelo)
  // ==========================================
  const dom = {
    // Relojes
    timeContinental: document.getElementById('time-continental'),
    timeMagallanes: document.getElementById('time-magallanes'),
    timeInsular: document.getElementById('time-insular'),

    // Búsqueda
    inputSearch: document.getElementById('input-city-search'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    btnSearchTrigger: document.getElementById('btn-search-trigger'),
    btnGeoDetect: document.getElementById('btn-geo-detect'),
    searchDropdown: document.getElementById('search-dropdown'),
    quickChipsList: document.getElementById('quick-chips-list'),

    // Estado / Loading
    statusBanner: document.getElementById('status-banner'),
    statusBannerText: document.getElementById('status-banner-text'),

    // Hero Weather Card
    currentCityName: document.getElementById('current-city-name'),
    currentRegionLabel: document.getElementById('current-region-label'),
    currentCoords: document.getElementById('current-coords'),
    btnToggleFavorite: document.getElementById('btn-toggle-favorite'),
    favStarIcon: document.getElementById('fav-star-icon'),
    heroWeatherIcon: document.getElementById('hero-weather-icon'),
    heroTempValue: document.getElementById('hero-temp-value'),
    btnUnitC: document.getElementById('btn-unit-c'),
    btnUnitF: document.getElementById('btn-unit-f'),
    heroConditionText: document.getElementById('hero-condition-text'),
    heroFeelsLike: document.getElementById('hero-feels-like'),
    dayNightText: document.getElementById('day-night-text'),
    lastUpdateTime: document.getElementById('last-update-time'),

    // Métricas Cinta Hero
    valWind: document.getElementById('val-wind'),
    valWindDir: document.getElementById('val-wind-dir'),
    valHumidity: document.getElementById('val-humidity'),
    valPressure: document.getElementById('val-pressure'),
    valRain: document.getElementById('val-rain'),

    // UV y Salud
    valUvIndex: document.getElementById('val-uv-index'),
    pillUvCategory: document.getElementById('pill-uv-category'),
    uvMeterFill: document.getElementById('uv-meter-fill'),
    uvAdviceText: document.getElementById('uv-advice-text'),

    // Brújula y Sol
    compassArrow: document.getElementById('compass-arrow'),
    compassHeadingText: document.getElementById('compass-heading-text'),
    compassSpeedText: document.getElementById('compass-speed-text'),
    valSunrise: document.getElementById('val-sunrise'),
    valSunset: document.getElementById('val-sunset'),

    // Pronósticos
    hourlyCardsContainer: document.getElementById('hourly-cards-container'),
    dailyCardsContainer: document.getElementById('daily-cards-container'),

    // Acciones de Cabecera y Modales
    btnRefreshWeather: document.getElementById('btn-refresh-weather'),
    btnOpenFavorites: document.getElementById('btn-open-favorites'),
    favoritesCountBadge: document.getElementById('favorites-count-badge'),
    btnOpenHistory: document.getElementById('btn-open-history'),

    // Modal Favoritos
    modalFavoritesBackdrop: document.getElementById('modal-favorites-backdrop'),
    modalFavoritesPanel: document.getElementById('modal-favorites-panel'),
    btnCloseFavorites: document.getElementById('btn-close-favorites'),
    favoritesListContainer: document.getElementById('favorites-list-container'),

    // Modal Historial
    modalHistoryBackdrop: document.getElementById('modal-history-backdrop'),
    modalHistoryPanel: document.getElementById('modal-history-panel'),
    btnCloseHistory: document.getElementById('btn-close-history'),
    btnClearHistory: document.getElementById('btn-clear-history'),
    historyListContainer: document.getElementById('history-list-container')
  };

  // ==========================================
  // RELOJES OFICIALES DE CHILE
  // ==========================================
  function updateChileanClocks() {
    const now = new Date();

    const formatTime = (tz) => {
      try {
        return new Intl.DateTimeFormat('es-CL', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).format(now);
      } catch (e) {
        return now.toLocaleTimeString('es-CL')
        ;
      }
    };

    if (dom.timeContinental) dom.timeContinental.textContent = formatTime('America/Santiago');
    if (dom.timeMagallanes) dom.timeMagallanes.textContent = formatTime('America/Punta_Arenas');
    if (dom.timeInsular) dom.timeInsular.textContent = formatTime('Pacific/Easter');
  }

  // ==========================================
  // CONVERSIÓN DE TEMPERATURAS
  // ==========================================
  function formatTemp(tempC) {
    if (tempC === null || tempC === undefined) return '--';
    if (state.unit === 'F') {
      const f = (tempC * 9 / 5) + 32;
      return `${Math.round(f)}°`;
    }
    return `${Math.round(tempC)}°`;
  }

  function formatTempNum(tempC) {
    if (tempC === null || tempC === undefined) return '--';
    if (state.unit === 'F') {
      return Math.round((tempC * 9 / 5) + 32);
    }
    return Math.round(tempC);
  }

  // ==========================================
  // LLAMADAS A LA API DEL TIEMPO
  // ==========================================
  async function fetchWeather(lat, lon, ciudad, region, timezone) {
    showStatus(`Obteniendo pronóstico meteorológico para ${ciudad}...`);
    try {
      state.lat = lat;
      state.lon = lon;
      state.city = ciudad;
      state.region = region;
      state.timezone = timezone || 'America/Santiago';
      
      const url = `/api/weather?lat=${lat}&lon=${lon}&ciudad=${encodeURIComponent(ciudad)}&region=${encodeURIComponent(region)}&timezone=${encodeURIComponent(state.timezone)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al conectar con la API de meteorología');
      }

      state.weatherData = data;
      renderWeather(data);
      updateFavoriteButtonState();
      updateActiveQuickChip(ciudad);
      hideStatus();
    } catch (err) {
      console.error('Error al cargar clima:', err);
      showStatus(`Error: ${err.message}`, true);
    }
  }

  // ==========================================
  // RENDERIZADO DEL CLIMA EN EL DOM
  // ==========================================
  function renderWeather(data) {
    const { location, current, hourly, daily } = data;

    // 1. Datos de Ubicación
    dom.currentCityName.textContent = location.ciudad;
    dom.currentRegionLabel.textContent = location.region || 'Chile';
    dom.currentCoords.textContent = `Lat: ${location.latitud.toFixed(2)}° | Lon: ${location.longitud.toFixed(2)}° • Zona: ${location.timezone}`;

    // 2. Estado de Ánimo del Fondo (Mood)
    document.body.setAttribute('data-mood', current.mood || 'mostly-sunny');

    // 3. Tarjeta Hero Principal
    dom.heroWeatherIcon.textContent = current.icono || '🌤️';
    dom.heroTempValue.textContent = formatTempNum(current.temperatura);
    dom.heroConditionText.textContent = current.condicion || 'Variable';
    dom.heroFeelsLike.innerHTML = `Sensación térmica: <span>${formatTemp(current.sensacion_termica)}</span>`;

    dom.dayNightText.textContent = current.es_de_dia ? 'Día' : 'Noche';
    const rawTime = current.hora_reporte || '';
    dom.lastUpdateTime.textContent = rawTime.includes('T') ? rawTime.split('T')[1].substring(0, 5) : rawTime;

    // 4. Métricas Rápidas en Cinta
    dom.valWind.textContent = `${current.viento_kmh} km/h`;
    dom.valWindDir.textContent = `Dir: ${current.viento_dir} (${current.viento_grados}°)`;
    dom.valHumidity.textContent = `${current.humedad}%`;
    dom.valPressure.textContent = `${current.presion_hpa} hPa`;
    dom.valRain.textContent = `${current.precipitacion_mm} mm`;

    // 5. Radiación UV y Salud (Estándar Chile)
    const uv = current.uv_index || 0;
    dom.valUvIndex.textContent = uv.toFixed(1);
    dom.pillUvCategory.textContent = current.uv_categoria.nivel;
    dom.pillUvCategory.style.color = current.uv_categoria.color;
    dom.pillUvCategory.style.borderColor = current.uv_categoria.color;

    // Barra UV (porcentaje sobre un máximo referencial de 12)
    const uvPercent = Math.min(100, Math.max(5, (uv / 12) * 100));
    dom.uvMeterFill.style.width = `${uvPercent}%`;
    dom.uvAdviceText.textContent = current.uv_categoria.recomendacion;

    // 6. Brújula y Rotación del Viento
    const windDeg = current.viento_grados || 0;
    dom.compassArrow.style.transform = `rotate(${windDeg}deg)`;
    dom.compassHeadingText.textContent = `Rumbo ${current.viento_dir} (${windDeg}°)`;
    dom.compassSpeedText.textContent = `${current.viento_kmh} km/h`;

    // Primer día para amanecer / atardecer
    if (daily && daily.length > 0) {
      dom.valSunrise.textContent = daily[0].sunrise || '--:--';
      dom.valSunset.textContent = daily[0].sunset || '--:--';
    }

    // 7. Renderizar Pronóstico por Horas (24 Horas)
    renderHourlyForecast(hourly);

    // 8. Renderizar Pronóstico Extendido a 7 Días
    renderDailyForecast(daily);
  }

  function renderHourlyForecast(hourlyList) {
    if (!dom.hourlyCardsContainer) return;
    dom.hourlyCardsContainer.innerHTML = '';

    if (!hourlyList || hourlyList.length === 0) {
      dom.hourlyCardsContainer.innerHTML = '<p class="text-dim">Sin pronóstico horario disponible</p>';
      return;
    }

    hourlyList.forEach((h, index) => {
      const card = document.createElement('div');
      card.className = 'hourly-card';
      card.innerHTML = `
        <span class="hourly-time">${index === 0 ? 'Ahora' : h.time}</span>
        <span class="hourly-icon" title="${h.desc}">${h.icon}</span>
        <span class="hourly-temp">${formatTemp(h.temp)}</span>
        <span class="hourly-rain" title="Probabilidad de lluvia">💧 ${h.rain_prob}%</span>
        <span class="hourly-wind">💨 ${h.wind} km/h</span>
      `;
      dom.hourlyCardsContainer.appendChild(card);
    });
  }

  function renderDailyForecast(dailyList) {
    if (!dom.dailyCardsContainer) return;
    dom.dailyCardsContainer.innerHTML = '';

    if (!dailyList || dailyList.length === 0) {
      dom.dailyCardsContainer.innerHTML = '<p class="text-dim">Sin pronóstico extendido disponible</p>';
      return;
    }

    dailyList.forEach((d) => {
      const card = document.createElement('article');
      card.className = 'daily-card';
      card.innerHTML = `
        <div class="daily-day-name">${d.day_name}</div>
        <div class="daily-date-sub">${d.day_formatted}</div>
        <div class="daily-icon" title="${d.desc}">${d.icon}</div>
        <div class="daily-desc-text">${d.desc}</div>
        <div class="daily-temp-bar-wrap">
          <div class="daily-temp-values">
            <span class="daily-min">${formatTemp(d.temp_min)}</span>
            <span class="daily-max">${formatTemp(d.temp_max)}</span>
          </div>
          <div class="daily-bar">
            <div class="daily-bar-fill" style="width: 100%;"></div>
          </div>
        </div>
        <div class="daily-rain-tag">💧 ${d.rain_prob}% prob.</div>
      `;
      dom.dailyCardsContainer.appendChild(card);
    });
  }

  // ==========================================
  // GESTIÓN DE FAVORITOS (SQLite)
  // ==========================================
  async function loadFavorites() {
    try {
      const res = await fetch('/api/favorites');
      const data = await res.json();
      if (data.ok) {
        state.favorites = data.favorites || [];
        updateFavoritesCountBadge();
        updateFavoriteButtonState();
        renderFavoritesList();
      }
    } catch (e) {
      console.warn('Error al cargar favoritos:', e);
    }
  }

  function updateFavoritesCountBadge() {
    if (dom.favoritesCountBadge) {
      dom.favoritesCountBadge.textContent = state.favorites.length;
    }
  }

  function updateFavoriteButtonState() {
    const isFav = state.favorites.some(f => f.ciudad.toLowerCase() === state.city.toLowerCase());
    if (dom.btnToggleFavorite) {
      if (isFav) {
        dom.btnToggleFavorite.classList.add('is-fav');
        dom.favStarIcon.textContent = '★';
        dom.btnToggleFavorite.setAttribute('title', 'Quitar de Favoritos');
      } else {
        dom.btnToggleFavorite.classList.remove('is-fav');
        dom.favStarIcon.textContent = '☆';
        dom.btnToggleFavorite.setAttribute('title', 'Agregar a Favoritos');
      }
    }
  }

  async function toggleCurrentFavorite() {
    const existing = state.favorites.find(f => f.ciudad.toLowerCase() === state.city.toLowerCase());
    if (existing) {
      // Eliminar
      try {
        await fetch(`/api/favorites/${existing.id}`, { method: 'DELETE' });
        await loadFavorites();
      } catch (e) {
        console.error('Error al eliminar favorito:', e);
      }
    } else {
      // Agregar
      try {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ciudad: state.city,
            region: state.region,
            latitud: state.lat,
            longitud: state.lon
          })
        });
        await loadFavorites();
      } catch (e) {
        console.error('Error al agregar favorito:', e);
      }
    }
  }

  function renderFavoritesList() {
    if (!dom.favoritesListContainer) return;
    dom.favoritesListContainer.innerHTML = '';

    if (state.favorites.length === 0) {
      dom.favoritesListContainer.innerHTML = '<p class="text-dim">Aún no tienes ciudades favoritas guardadas.</p>';
      return;
    }

    state.favorites.forEach(fav => {
      const row = document.createElement('div');
      row.className = 'fav-item-row';
      row.innerHTML = `
        <div class="fav-item-info">
          <span class="fav-item-city">${fav.ciudad}</span>
          <span class="fav-item-region">${fav.region}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button type="button" class="btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;">Ver</button>
          <button type="button" class="btn-delete-fav" title="Eliminar favorito">✕</button>
        </div>
      `;

      // Clic para consultar esa ciudad
      row.querySelector('.fav-item-info').addEventListener('click', () => {
        fetchWeather(fav.latitud, fav.longitud, fav.ciudad, fav.region);
        closeFavoritesModal();
      });
      row.querySelector('.btn-primary').addEventListener('click', () => {
        fetchWeather(fav.latitud, fav.longitud, fav.ciudad, fav.region);
        closeFavoritesModal();
      });

      // Clic para borrar
      row.querySelector('.btn-delete-fav').addEventListener('click', async (e) => {
        e.stopPropagation();
        await fetch(`/api/favorites/${fav.id}`, { method: 'DELETE' });
        await loadFavorites();
      });

      dom.favoritesListContainer.appendChild(row);
    });
  }

  // ==========================================
  // GESTIÓN DEL HISTORIAL (SQLite)
  // ==========================================
  async function openHistoryModal() {
    dom.modalHistoryBackdrop.style.display = 'flex';
    dom.historyListContainer.innerHTML = '<p class="text-dim">Cargando historial...</p>';

    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (!data.ok || !data.history || data.history.length === 0) {
        dom.historyListContainer.innerHTML = '<p class="text-dim">No hay consultas registradas aún.</p>';
        return;
      }

      dom.historyListContainer.innerHTML = '';
      data.history.forEach(item => {
        const row = document.createElement('div');
        row.className = 'history-item-row';
        row.innerHTML = `
          <div class="history-item-info">
            <span class="history-item-city">${item.ciudad}</span>
            <span class="history-item-region">${item.region || 'Chile'} • ${item.condicion || ''}</span>
          </div>
          <div class="history-item-meta">
            <span class="history-temp">${formatTemp(item.temperatura)}</span>
            <span class="history-time">${item.consultado_en ? item.consultado_en.substring(11, 16) : ''}</span>
          </div>
        `;
        row.addEventListener('click', () => {
          // Buscar y consultar de nuevo
          searchAndSelectCity(item.ciudad);
          closeHistoryModal();
        });
        dom.historyListContainer.appendChild(row);
      });
    } catch (e) {
      dom.historyListContainer.innerHTML = '<p class="text-dim">Error cargando historial.</p>';
    }
  }

  async function clearHistory() {
    if (!confirm('¿Deseas vaciar el historial de consultas de la base de datos?')) return;
    try {
      await fetch('/api/history', { method: 'DELETE' });
      openHistoryModal();
    } catch (e) {
      console.error(e);
    }
  }

  // ==========================================
  // BÚSQUEDA Y AUTOCOMPLETADO
  // ==========================================
  function setupSearch() {
    dom.inputSearch.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      dom.btnClearSearch.style.display = val ? 'block' : 'none';

      clearTimeout(state.searchDebounceTimer);
      if (val.length < 2) {
        dom.searchDropdown.style.display = 'none';
        return;
      }

      state.searchDebounceTimer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`);
          const data = await res.json();
          renderSearchDropdown(data.results || []);
        } catch (err) {
          console.warn('Error buscando ciudad:', err);
        }
      }, 250);
    });

    dom.btnClearSearch.addEventListener('click', () => {
      dom.inputSearch.value = '';
      dom.btnClearSearch.style.display = 'none';
      dom.searchDropdown.style.display = 'none';
      dom.inputSearch.focus();
    });

    dom.btnSearchTrigger.addEventListener('click', () => {
      const q = dom.inputSearch.value.trim();
      if (q) searchAndSelectCity(q);
    });

    dom.inputSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = dom.inputSearch.value.trim();
        if (q) searchAndSelectCity(q);
      }
    });

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!dom.inputSearch.contains(e.target) && !dom.searchDropdown.contains(e.target)) {
        dom.searchDropdown.style.display = 'none';
      }
    });
  }

  function renderSearchDropdown(results) {
    if (!results || results.length === 0) {
      dom.searchDropdown.style.display = 'none';
      return;
    }

    dom.searchDropdown.innerHTML = '';
    results.forEach(item => {
      const div = document.createElement('div');
      div.className = 'dropdown-item';
      div.innerHTML = `
        <div>
          <span class="dropdown-city">🇨🇱 ${item.ciudad}</span>
          <span class="dropdown-region"> - ${item.region}</span>
        </div>
        <span class="dropdown-tag">${item.origen === 'local' ? 'Chile' : 'Geo'}</span>
      `;
      div.addEventListener('click', () => {
        dom.inputSearch.value = item.ciudad;
        dom.searchDropdown.style.display = 'none';
        fetchWeather(item.latitud, item.longitud, item.ciudad, item.region, item.timezone);
      });
      dom.searchDropdown.appendChild(div);
    });

    dom.searchDropdown.style.display = 'block';
  }

  async function searchAndSelectCity(query) {
    dom.searchDropdown.style.display = 'none';
    showStatus(`Buscando "${query}"...`);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.ok && data.results && data.results.length > 0) {
        const first = data.results[0];
        fetchWeather(first.latitud, first.longitud, first.ciudad, first.region, first.timezone);
      } else {
        showStatus(`No se encontró "${query}" en Chile. Prueba con otra ciudad.`, true);
      }
    } catch (e) {
      showStatus('Error al buscar ciudad.', true);
    }
  }

  // ==========================================
  // GEOLOCALIZACIÓN DEL NAVEGADOR
  // ==========================================
  function setupGeolocation() {
    dom.btnGeoDetect.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Tu navegador no soporta geolocalización.');
        return;
      }

      showStatus('Detectando coordenadas de tu ubicación...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          fetchWeather(lat, lon, 'Mi Ubicación', 'Chile', 'America/Santiago');
        },
        (err) => {
          console.warn('Geolocalización rechazada:', err);
          showStatus('No se pudo obtener tu ubicación. Mostrando Santiago por defecto.', true);
          fetchWeather(-33.4489, -70.6693, 'Santiago', 'Región Metropolitana', 'America/Santiago');
        },
        { timeout: 8000 }
      );
    });
  }

  // ==========================================
  // CHIPS RÁPIDOS
  // ==========================================
  function setupQuickChips() {
    const chips = dom.quickChipsList.querySelectorAll('.chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const city = chip.dataset.city;
        const region = chip.dataset.region;
        const lat = parseFloat(chip.dataset.lat);
        const lon = parseFloat(chip.dataset.lon);
        const tz = chip.dataset.tz || 'America/Santiago';

        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        fetchWeather(lat, lon, city, region, tz);
      });
    });
  }

  function updateActiveQuickChip(cityName) {
    const chips = dom.quickChipsList.querySelectorAll('.chip');
    chips.forEach(chip => {
      if (chip.dataset.city.toLowerCase() === cityName.toLowerCase()) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  // ==========================================
  // INTERRUPTORES DE UNIDADES (°C / °F)
  // ==========================================
  function setupUnitToggles() {
    dom.btnUnitC.addEventListener('click', () => {
      if (state.unit !== 'C') {
        state.unit = 'C';
        dom.btnUnitC.classList.add('active');
        dom.btnUnitF.classList.remove('active');
        if (state.weatherData) renderWeather(state.weatherData);
      }
    });

    dom.btnUnitF.addEventListener('click', () => {
      if (state.unit !== 'F') {
        state.unit = 'F';
        dom.btnUnitF.classList.add('active');
        dom.btnUnitC.classList.remove('active');
        if (state.weatherData) renderWeather(state.weatherData);
      }
    });
  }

  // ==========================================
  // MANIPULACIÓN DE MODALES
  // ==========================================
  function closeFavoritesModal() {
    dom.modalFavoritesBackdrop.style.display = 'none';
  }

  function closeHistoryModal() {
    dom.modalHistoryBackdrop.style.display = 'none';
  }

  function setupModals() {
    dom.btnOpenFavorites.addEventListener('click', () => {
      loadFavorites();
      dom.modalFavoritesBackdrop.style.display = 'flex';
    });
    dom.btnCloseFavorites.addEventListener('click', closeFavoritesModal);
    dom.modalFavoritesBackdrop.addEventListener('click', (e) => {
      if (e.target === dom.modalFavoritesBackdrop) closeFavoritesModal();
    });

    dom.btnOpenHistory.addEventListener('click', openHistoryModal);
    dom.btnCloseHistory.addEventListener('click', closeHistoryModal);
    dom.btnClearHistory.addEventListener('click', clearHistory);
    dom.modalHistoryBackdrop.addEventListener('click', (e) => {
      if (e.target === dom.modalHistoryBackdrop) closeHistoryModal();
    });
  }

  // ==========================================
  // HELPERS DE ESTADO Y MENSAJES
  // ==========================================
  function showStatus(msg, isError = false) {
    if (!dom.statusBanner) return;
    dom.statusBanner.style.display = 'flex';
    dom.statusBannerText.textContent = msg;
    if (isError) {
      dom.statusBanner.style.background = 'rgba(239, 68, 68, 0.15)';
      dom.statusBanner.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      dom.statusBannerText.style.color = '#ef4444';
      setTimeout(hideStatus, 5000);
    } else {
      dom.statusBanner.style.background = 'rgba(14, 165, 233, 0.1)';
      dom.statusBanner.style.borderColor = 'rgba(14, 165, 233, 0.3)';
      dom.statusBannerText.style.color = 'var(--accent-cyan)';
    }
  }

  function hideStatus() {
    if (dom.statusBanner) {
      dom.statusBanner.style.display = 'none';
    }
  }

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================
  function init() {
    // Reloj dinámico de Chile
    updateChileanClocks();
    setInterval(updateChileanClocks, 1000);

    // Eventos de controles
    setupSearch();
    setupGeolocation();
    setupQuickChips();
    setupUnitToggles();
    setupModals();

    if (dom.btnToggleFavorite) {
      dom.btnToggleFavorite.addEventListener('click', toggleCurrentFavorite);
    }

    if (dom.btnRefreshWeather) {
      dom.btnRefreshWeather.addEventListener('click', () => {
        fetchWeather(state.lat, state.lon, state.city, state.region, state.timezone);
      });
    }

    // Cargar favoritos iniciales desde la BD
    loadFavorites();

    // Consulta meteorológica inicial (Santiago de Chile)
    fetchWeather(state.lat, state.lon, state.city, state.region, state.timezone);
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
