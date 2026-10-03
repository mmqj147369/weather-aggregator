import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [coords, setCoords] = useState({ lat: 39.05, lon: -0.35 });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_URL}/weather?lat=${coords.lat}&lon=${coords.lon}`
      );
      const data = await response.json();
      if (data.success) {
        setWeather(data.data);
      } else {
        setError('Error al obtener datos');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const handleCoordChange = (field, value) => {
    setCoords(prev => ({ ...prev, [field]: parseFloat(value) }));
  };

  return (
    <div className="App">
      <header className="header">
        <h1>🌦️ Agregador Meteorológico</h1>
        <p>Datos de Meteociel, AEMET y Twitter</p>
      </header>

      <div className="container">
        <div className="controls">
          <input
            type="number"
            placeholder="Latitud"
            value={coords.lat}
            onChange={(e) => handleCoordChange('lat', e.target.value)}
            step="0.01"
          />
          <input
            type="number"
            placeholder="Longitud"
            value={coords.lon}
            onChange={(e) => handleCoordChange('lon', e.target.value)}
            step="0.01"
          />
          <button onClick={fetchWeather} disabled={loading}>
            {loading ? '⏳ Cargando...' : '🔍 Actualizar'}
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {weather && (
          <div className="weather-data">
            <h2>{weather.source}</h2>
            <p className="location">📍 {weather.location}</p>
            <p className="timestamp">{new Date(weather.timestamp).toLocaleString()}</p>

            <div className="forecast">
              {weather.forecast?.slice(0, 12).map((item, idx) => (
                <div key={idx} className="forecast-item">
                  <div className="hour">{item.hour}</div>
                  {item.temperature && (
                    <div className="temp">🌡️ {item.temperature.toFixed(1)}°C</div>
                  )}
                  {item.precipitation && (
                    <div className="rain">🌧️ {item.precipitation.toFixed(1)}mm</div>
                  )}
                  {item.wind && (
                    <div className="wind">💨 {item.wind.toFixed(1)} km/h</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!weather && !error && !loading && (
          <div className="empty">
            <p>Cargando datos meteorológicos...</p>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>🌦️ Agregador meteorológico - Datos de Meteociel, AEMET y Twitter/X</p>
      </footer>
    </div>
  );
}

export default App;
