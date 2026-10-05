const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const CONFIG = {
  aemet: {
    apiKey: process.env.AEMET_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NjEwMzA3MjEzNDU3ZTAwMDEzZDhhYmIiLCJpYXQiOjE3MTI1MzIzNjcsImV4cCI6MTc0NDA2NDM2N30.fHJz0zMoIe9dUjX-R6vJp6UYJWCnhFh2gVfPHC7Ij_4',
    baseUrl: 'https://opendata.aemet.es/opendata/api'
  }
};

async function getAEMETForecast(lat, lon) {
  try {
    console.log('[AEMET] Buscando coordenadas...');

    const coordResponse = await axios.get(CONFIG.aemet.baseUrl + '/maestro/municipios', {
      params: { api_key: CONFIG.aemet.apiKey }
    });

    const municipios = coordResponse.data;
    let closestMunicipio = null;
    let minDistance = Infinity;

    for (const municipio of municipios) {
      const muniLat = parseFloat(municipio.latitud);
      const muniLon = parseFloat(municipio.longitud);
      const distance = Math.sqrt(Math.pow(muniLat - lat, 2) + Math.pow(muniLon - lon, 2));

      if (distance < minDistance) {
        minDistance = distance;
        closestMunicipio = municipio;
      }
    }

    if (!closestMunicipio) {
      throw new Error('No se encontro municipio cercano');
    }

    console.log('[AEMET] Municipio mas cercano: ' + closestMunicipio.nombre);

    const forecastResponse = await axios.get(
      CONFIG.aemet.baseUrl + '/prediccion/especifica/municipio/diaria/' + closestMunicipio.codigo,
      { params: { api_key: CONFIG.aemet.apiKey } }
    );

    const forecastData = forecastResponse.data;

    const forecast = [];
    if (forecastData.prediccion && forecastData.prediccion.dia) {
      const dias = forecastData.prediccion.dia.slice(0, 2);

      dias.forEach((dia, dayIdx) => {
        const fecha = dia.fecha || '';
        const tempMax = dia.temperatura && dia.temperatura.maxima ? dia.temperatura.maxima : null;
        const tempMin = dia.temperatura && dia.temperatura.minima ? dia.temperatura.minima : null;
        const lluvia = dia.precipitacion ? dia.precipitacion : null;
        const viento = dia.viento && dia.viento[0] ? dia.viento[0].velocidad : null;

        forecast.push({
          hour: fecha,
          temperature: tempMax ? parseFloat(tempMax) : null,
          temperatureMin: tempMin ? parseFloat(tempMin) : null,
          precipitation: lluvia ? parseFloat(lluvia) : null,
          wind: viento ? parseFloat(viento) : null
        });
      });
    }

    return {
      timestamp: new Date().toISOString(),
      source: 'AEMET',
      location: closestMunicipio.nombre + ' (' + lat + ',' + lon + ')',
      forecast: forecast
    };
  } catch (error) {
    console.error('[AEMET] Error:', error.message);
    return null;
  }
}

app.get('/api/weather', async (req, res) => {
  const lat = parseFloat(req.query.lat) || 39.05;
  const lon = parseFloat(req.query.lon) || -0.35;

  try {
    const data = await getAEMETForecast(lat, lon);
    if (data) {
      res.json({
        success: true,
        data: data
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'No se pudo obtener datos meteorologicos'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      aemet: 'ready',
      version: '1.0.0'
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Weather Aggregator API',
    endpoints: {
      weather: '/api/weather?lat=39.05&lon=-0.35',
      status: '/api/status'
    }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('Weather API running on port ' + PORT);
});
