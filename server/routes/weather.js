// server/routes/weather.js
import express from 'express';
import { db } from '../database.js';
import { getCurrentWeather, checkRainForecast } from '../weather.js';

const router = express.Router();

// 날씨 설정 조회
router.get('/settings', (req, res) => {
  db.get('SELECT api_key, city FROM weather_settings WHERE id = 1', (err, row) => {
    if (err) {
      console.error('날씨 설정 조회 실패:', err);
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
          console.error('날씨 설정 저장 실패:', err);
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

// 날씨 API 테스트 (이 부분을 추가!)
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
    console.error('날씨 API 테스트 실패:', error);
    res.status(400).json({
      success: false,
      message: '날씨 API 연결에 실패했습니다.',
      error: error.message
    });
  }
});

// 현재 날씨 조회 (이 부분도 추가!)
router.get('/current', async (req, res) => {
  try {
    const weather = await getCurrentWeather();
    res.json(weather);
  } catch (error) {
    console.error('현재 날씨 조회 실패:', error);
    res.status(500).json({
      error: '날씨 정보를 가져올 수 없습니다.',
      message: error.message
    });
  }
});

// 비 예보 확인 (이 부분도 추가!)
router.get('/rain-check', async (req, res) => {
  try {
    const rainForecast = await checkRainForecast();
    res.json(rainForecast);
  } catch (error) {
    console.error('비 예보 확인 실패:', error);
    res.status(500).json({
      error: '비 예보를 확인할 수 없습니다.',
      message: error.message
    });
  }
});


export default router;