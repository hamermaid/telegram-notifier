// server/weather.js
import { db } from './database.js';

// 날씨 API 설정 (OpenWeatherMap)
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

// 날씨 API 키와 위치 설정 조회
async function getWeatherSettings() {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM weather_settings WHERE id = 1', (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
}

// 현재 날씨 조회
export async function getCurrentWeather() {
  try {
    const settings = await getWeatherSettings();

    if (!settings || !settings.api_key || !settings.city) {
      throw new Error('날씨 API 설정이 완료되지 않았습니다.');
    }

    const url = `${WEATHER_API_BASE}/weather?q=${settings.city}&appid=${settings.api_key}&units=metric&lang=kr`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`날씨 API 호출 실패: ${response.status}`);
    }

    const data = await response.json();

    return {
      city: data.name,
      temperature: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      weather: data.weather[0].description,
      weather_main: data.weather[0].main,
      icon: data.weather[0].icon
    };
  } catch (error) {
    console.error('날씨 조회 실패:', error.message);
    throw error;
  }
}

// 비 예보 확인 (다음 12시간 내)
export async function checkRainForecast() {
  try {
    const settings = await getWeatherSettings();

    if (!settings || !settings.api_key || !settings.city) {
      throw new Error('날씨 API 설정이 완료되지 않았습니다.');
    }

    // 간단한 버전: 현재 날씨만 체크
    const weather = await getCurrentWeather();

    const hasRain = ['Rain', 'Drizzle', 'Thunderstorm'].includes(weather.weather_main);
    const rainProbability = hasRain ? 80 : 20; // 임시값

    return {
      has_rain: hasRain,
      max_rain_probability: rainProbability,
      total_rain_amount: 0,
      should_bring_umbrella: rainProbability >= 30 || hasRain,
      forecast_periods: []
    };
  } catch (error) {
    console.error('비 예보 확인 실패:', error.message);
    throw error;
  }
}