// server/routes/weather.js
import express from 'express';
import { db } from '../database.js';
import { getCurrentWeather, getWeatherForecast, checkRainForecast, generateWeatherMessage, getWeatherRecommendation } from '../weather.js';

const router = express.Router();

// 날씨 설정 조회
router.get('/settings', (req, res) => {
  db.get('SELECT api_key, city FROM weather_settings WHERE id = 1', (err, row) => {
    if (err) {
      res.status(500).json({ error: '설정을 불러올 수 없습니다.' });
      return;
    }
    
    // API 키는 보안을 위해 일부만 표시
    const maskedApiKey = row?.api_key ? 
      row.api_key.substring(0, 8) + '...' + row.api_key.slice(-4) : null;
    
    res.json({
      api_key: maskedApiKey,
      city: row?.city || 'Seoul',
      is_configured: !!(row?.api_key)
    });
  });
});

// 날씨 설정 저장
router.post('/settings', (req, res) => {
  const { api_key, city } = req.body;
  
  if (!api_key) {
    res.status(400).json({ error: 'API 키는 필수입니다.' });
    return;
  }
  
  const finalCity = city || 'Seoul';
  
  db.run(
    'UPDATE weather_settings SET api_key = ?, city = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
    [api_key, finalCity],
    function(err) {
      if (err) {
        res.status(500).json({ error: '설정 저장에 실패했습니다.' });
        return;
      }
      
      res.json({ 
        success: true, 
        message: '날씨 설정이 저장되었습니다.',
        city: finalCity
      });
    }
  );
});

// 현재 날씨 조회
router.get('/current', async (req, res) => {
  try {
    const weather = await getCurrentWeather();
    res.json(weather);
  } catch (error) {
    res.status(500).json({ 
      error: '날씨 정보를 가져올 수 없습니다.',
      message: error.message 
    });
  }
});

// 날씨 예보 조회
router.get('/forecast', async (req, res) => {
  try {
    const forecast = await getWeatherForecast();
    res.json(forecast);
  } catch (error) {
    res.status(500).json({ 
      error: '날씨 예보를 가져올 수 없습니다.',
      message: error.message 
    });
  }
});

// 비 예보 확인
router.get('/rain-check', async (req, res) => {
  try {
    const rainForecast = await checkRainForecast();
    res.json(rainForecast);
  } catch (error) {
    res.status(500).json({ 
      error: '비 예보를 확인할 수 없습니다.',
      message: error.message 
    });
  }
});

// 날씨 알림 메시지 생성
router.get('/notification-message', async (req, res) => {
  try {
    const currentWeather = await getCurrentWeather();
    const rainForecast = await checkRainForecast();
    
    const message = generateWeatherMessage(currentWeather, rainForecast);
    const recommendations = getWeatherRecommendation(currentWeather, rainForecast);
    
    res.json({
      message,
      recommendations,
      weather: currentWeather,
      rain_forecast: rainForecast
    });
  } catch (error) {
    res.status(500).json({ 
      error: '날씨 알림 메시지를 생성할 수 없습니다.',
      message: error.message 
    });
  }
});

// 날씨 API 테스트
router.post('/test', async (req, res) => {
  try {
    const currentWeather = await getCurrentWeather();
    const rainForecast = await checkRainForecast();
    
    res.json({
      success: true,
      message: '날씨 API 연결이 정상입니다!',
      current_weather: currentWeather,
      rain_forecast: rainForecast
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '날씨 API 연결에 실패했습니다.',
      error: error.message
    });
  }
});

export default router;