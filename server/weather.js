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

// 날씨 예보 조회 (5일 예보)
export async function getWeatherForecast() {
  try {
    const settings = await getWeatherSettings();
    
    if (!settings || !settings.api_key || !settings.city) {
      throw new Error('날씨 API 설정이 완료되지 않았습니다.');
    }
    
    const url = `${WEATHER_API_BASE}/forecast?q=${settings.city}&appid=${settings.api_key}&units=metric&lang=kr`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`날씨 예보 API 호출 실패: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 다음 24시간 예보만 추출 (3시간 간격 × 8개 = 24시간)
    const next24Hours = data.list.slice(0, 8).map(item => ({
      time: new Date(item.dt * 1000),
      temperature: Math.round(item.main.temp),
      weather: item.weather[0].description,
      weather_main: item.weather[0].main,
      rain_probability: Math.round((item.pop || 0) * 100), // 강수 확률 (%)
      rain_amount: item.rain ? (item.rain['3h'] || 0) : 0  // 3시간 강수량 (mm)
    }));
    
    return next24Hours;
  } catch (error) {
    console.error('날씨 예보 조회 실패:', error.message);
    throw error;
  }
}

// 비 예보 확인 (다음 12시간 내)
export async function checkRainForecast() {
  try {
    const forecast = await getWeatherForecast();
    
    // 다음 12시간 (4개 구간) 체크
    const next12Hours = forecast.slice(0, 4);
    
    let maxRainProbability = 0;
    let totalRainAmount = 0;
    let hasRain = false;
    
    next12Hours.forEach(period => {
      maxRainProbability = Math.max(maxRainProbability, period.rain_probability);
      totalRainAmount += period.rain_amount;
      
      // 비, 소나기, 천둥번개 등 비 관련 날씨
      if (['Rain', 'Drizzle', 'Thunderstorm'].includes(period.weather_main)) {
        hasRain = true;
      }
    });
    
    return {
      has_rain: hasRain,
      max_rain_probability: maxRainProbability,
      total_rain_amount: totalRainAmount,
      should_bring_umbrella: maxRainProbability >= 30 || hasRain, // 30% 이상이면 우산 권장
      forecast_periods: next12Hours
    };
  } catch (error) {
    console.error('비 예보 확인 실패:', error.message);
    throw error;
  }
}

// 날씨 기반 메시지 생성
export function generateWeatherMessage(currentWeather, rainForecast) {
  let message = `🌤️ **오늘의 날씨**\n`;
  message += `📍 ${currentWeather.city}\n`;
  message += `🌡️ ${currentWeather.temperature}°C (체감 ${currentWeather.feels_like}°C)\n`;
  message += `💧 습도 ${currentWeather.humidity}%\n`;
  message += `☁️ ${currentWeather.weather}\n\n`;
  
  if (rainForecast.should_bring_umbrella) {
    message += `☔ **우산을 챙기세요!**\n`;
    message += `🌧️ 강수 확률: ${rainForecast.max_rain_probability}%\n`;
    
    if (rainForecast.total_rain_amount > 0) {
      message += `💧 예상 강수량: ${rainForecast.total_rain_amount.toFixed(1)}mm\n`;
    }
  } else {
    message += `☀️ **맑은 하루 되세요!**\n`;
    message += `🌧️ 강수 확률: ${rainForecast.max_rain_probability}%\n`;
  }
  
  return message;
}

// 날씨 기반 추천 메시지
export function getWeatherRecommendation(currentWeather, rainForecast) {
  const temp = currentWeather.temperature;
  let recommendations = [];
  
  // 온도별 추천
  if (temp <= 0) {
    recommendations.push('🧥 두꺼운 외투를 입으세요');
    recommendations.push('🧤 장갑과 목도리도 챙기세요');
  } else if (temp <= 10) {
    recommendations.push('🧥 따뜻한 옷을 입으세요');
  } else if (temp <= 20) {
    recommendations.push('👕 가벼운 겉옷을 준비하세요');
  } else if (temp >= 30) {
    recommendations.push('👕 시원한 옷차림을 하세요');
    recommendations.push('💧 충분한 수분 섭취하세요');
  }
  
  // 날씨별 추천
  if (rainForecast.should_bring_umbrella) {
    recommendations.push('☔ 우산 또는 우비를 챙기세요');
  }
  
  if (currentWeather.humidity >= 80) {
    recommendations.push('💨 습도가 높으니 통풍이 잘 되는 옷을 입으세요');
  }
  
  return recommendations;
}