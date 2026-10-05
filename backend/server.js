const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const CONFIG = {
  meteociel: {
    baseUrl: 'https://www.meteociel.fr/modeles/arome_sp.php',
    lat: 39.05,
    lon: -0.35
  },
  aemet: {
    apiKey: process.env.AEMET_API_KEY || '',
    baseUrl: 'https://opendata.aemet.es/opendata'
  },
  twitter: {
    bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
  }
};

async function getMeteocielData(lat, lon) {
  try {
    const url = CONFIG.meteociel.baseUrl + '?lat=' + lat + '&lon=' + lon;
    console.log('[Meteociel] Consultando...');

    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MeteoBot/1.0)' },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const forecast = [];

    $('table').each((i, table) => {
      $(table).find('tr').each((rowIdx, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 2) {
          try {
            const hour = $(cells[0]).text().trim();
            const temp = $(cells[1]).text().trim();
            const rain = $(cells[2]).text().trim();
            const wind = $(cells[3]).text().trim();

            if (hour && (temp || rain)) {
              forecast.push({
                hour: hour,
                temperature: parseFloat(temp) || null,
                precipitation: parseFloat(rain) || null,
                wind: parseFloat(wind) || null
              });
            }
          } catch (e) {
            // Skip invalid rows
          }
        }
      });
    });

    return {
      timestamp: new Date().toISOString(),
      source: 'AROME (Meteociel)',
      location: lat + ',' + lon,
      forecast: forecast.slice(0, 24)
    };
  } catch (error) {
    console.error('[Meteociel] Error:', error.message);
    return null;
  }
}

app.get('/api/weather', async (req, res) => {
  const lat = parseFloat(req.query.lat) || CONFIG.meteociel.lat;
  const lon = parseFloat(req.query.lon) || CONFIG.meteociel.lon;

  try {
    const data = await getMeteocielData(lat, lon);
    res.json({
      success: true,
      data: data
    });
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
      meteociel: 'ready',
      aemet: CONFIG.aemet.apiKey ? 'configured' : 'missing_key',
      twitter: CONFIG.twitter.bearerToken ? 'configured' : 'missing_token'
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
  console.log('\n=== Weather Aggregator Backend ===');
  console.log('Port: ' + PORT);
  console.log('GET /api/weather?lat=39.05&lon=-0.35');
  console.log('GET /api/status');
  console.log('===================================\n');
});
