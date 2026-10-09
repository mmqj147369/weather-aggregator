import React, { useState } from 'react';
import './App.css';

function App() {
  const [latitude, setLatitude] = useState(39.05);
  const [longitude, setLongitude] = useState(-0.35);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(
        `${apiUrl}/api/weather?lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      if (data.success) {
        setWeatherData(data.data);
      } else {
        setError(data.error || 'Error fetching weather');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🌍 Weather Aggregator</h1>
        <p>Real-time meteorological data for your location</p>
      </header>

      <div className="container">
        <div className="input-section">
          <div className="input-group">
            <label>Latitude:</label>
            <input
              type="number"
              step="0.01"
              value={latitude}
              onChange={(e) => setLatitude(parseFloat(e.target.value))}
              placeholder="39.05"
            />
          </div>

          <div className="input-group">
            <label>Longitude:</label>
            <input
              type="number"
              step="0.01"
              value={longitude}
              onChange={(e) => setLongitude(parseFloat(e.target.value))}
              placeholder="-0.35"
            />
          </div>

          <button onClick={fetchWeather} disabled={loading} className="fetch-btn">
            {loading ? 'Loading...' : 'Get Weather'}
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {weatherData && (
          <div className="weather-section">
            <h2>📍 {weatherData.location}</h2>
            <p className="source">Source: {weatherData.source}</p>

            <div className="forecast-grid">
              {weatherData.forecast.map((day, idx) => (
                <div key={idx} className="forecast-card">
                  <div className="day-label">{day.hour}</div>
                  {day.temperature && (
                    <div className="temp">
                      🌡️ {day.temperature}°C
                    </div>
                  )}
                  {day.temperatureMin && (
                    <div className="temp-min">
                      Min: {day.temperatureMin}°C
                    </div>
                  )}
                  {day.precipitation !== null && (
                    <div className="rain">
                      💧 {day.precipitation}mm
                    </div>
                  )}
                  {day.wind && (
                    <div className="wind">
                      💨 {day.wind} km/h
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
