/**
 * Weather service — port of services/weather_service.py.
 *
 * Tries OpenWeatherMap (OPENWEATHER_API_KEY env var). Falls back to a
 * deterministic stub when no key is configured so the demo works offline.
 * Lat/lng are rounded to 2dp (~1 km) and cached in WeatherSnapshot for
 * ~1 hour to stay under the free tier.
 */
const { env } = require("../config/env");
const { prisma } = require("../db/client");
const { newSnapshotId } = require("../utils/ids");

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const OWM_URL = "https://api.openweathermap.org/data/2.5/weather";
const OWM_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

function round2(v) {
  return Math.round(v * 100) / 100;
}

function stubPayload(lat, lng) {
  const seed = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453);
  const baseTemp = 20 + (seed % 14);
  const humidity = 40 + Math.floor((seed * 7) % 50);
  const conditions = ["Clear", "Clouds", "Light rain", "Haze", "Thunderstorm"];
  const cond = conditions[Math.floor(seed * 11) % conditions.length];
  const now = new Date();

  const forecast = [];
  for (let i = 0; i < 3; i += 1) {
    const t = baseTemp + (i - 1) * 2.3;
    forecast.push({
      date: new Date(now.getTime() + (i + 1) * 86400000).toISOString().slice(0, 10),
      min: Math.round((t - 3) * 10) / 10,
      max: Math.round((t + 4) * 10) / 10,
      condition: conditions[Math.floor((seed + i * 3) % conditions.length)],
      humidity: humidity + i * 2,
    });
  }

  return {
    source: "stub",
    current: {
      temp_c: Math.round(baseTemp * 10) / 10,
      condition: cond,
      humidity,
      wind_kmh: Math.round((5 + (seed % 18)) * 10) / 10,
    },
    forecast,
    location: { lat, lng },
    advisory: advisory(baseTemp, humidity, cond),
  };
}

function advisory(tempC, humidity, condition) {
  const c = String(condition).toLowerCase();
  if (c.includes("rain") || c.includes("thunder")) {
    return "Postpone outdoor spraying; rain expected.";
  }
  if (tempC > 32 && humidity < 35) {
    return "Hot and dry — irrigate young plants this evening.";
  }
  if (humidity > 80 && tempC > 24) {
    return "High humidity — watch for fungal diseases on leaves.";
  }
  return "Conditions are favourable for routine field work.";
}

async function fromOpenWeatherMap(lat, lng, apiKey) {
  try {
    const [curRes, fcRes] = await Promise.all([
      fetch(`${OWM_URL}?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`, { signal: AbortSignal.timeout(8000) }),
      fetch(`${OWM_FORECAST_URL}?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`, { signal: AbortSignal.timeout(8000) }),
    ]);
    if (curRes.status !== 200 || fcRes.status !== 200) return null;
    const curData = await curRes.json();
    const fcData = await fcRes.json();

    const condition = (curData.weather || [{}])[0].main || "Clear";
    const humidity = (curData.main || {}).humidity || 0;
    const temp = (curData.main || {}).temp || 0;

    const forecast = [];
    const seenDates = new Set();
    for (const slot of fcData.list || []) {
      const day = (slot.dt_txt || "").slice(0, 10);
      if (!day || seenDates.has(day)) continue;
      seenDates.add(day);
      const main = slot.main || {};
      forecast.push({
        date: day,
        min: main.temp_min,
        max: main.temp_max,
        condition: (slot.weather || [{}])[0].main,
        humidity: main.humidity,
      });
      if (forecast.length >= 3) break;
    }

    return {
      source: "openweathermap",
      current: {
        temp_c: temp,
        condition,
        humidity,
        wind_kmh: Math.round(((curData.wind || {}).speed || 0) * 3.6 * 10) / 10,
      },
      forecast,
      location: { lat, lng, name: curData.name },
      advisory: advisory(temp, humidity, condition),
    };
  } catch {
    return null;
  }
}

async function getWeather(lat, lng) {
  const rLat = round2(lat);
  const rLng = round2(lng);
  const cutoff = new Date(Date.now() - CACHE_TTL_MS);

  const cached = await prisma.weatherSnapshot.findFirst({
    where: {
      gps_lat: rLat,
      gps_lng: rLng,
      fetched_at: { gte: cutoff },
    },
    orderBy: { fetched_at: "desc" },
  });
  if (cached) {
    return { payload: cached.payload_json, cached: true, provider: cached.provider };
  }

  let payload = null;
  if (env.OPENWEATHER_API_KEY) {
    payload = await fromOpenWeatherMap(rLat, rLng, env.OPENWEATHER_API_KEY);
  }
  const provider = payload ? "openweathermap" : "stub";
  if (!payload) payload = stubPayload(rLat, rLng);

  await prisma.weatherSnapshot.create({
    data: {
      snapshot_id: newSnapshotId(),
      gps_lat: rLat,
      gps_lng: rLng,
      provider,
      payload_json: payload,
    },
  });

  return { payload, cached: false, provider };
}

module.exports = { getWeather, stubPayload };