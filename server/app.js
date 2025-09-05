// server/app.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './database.js';
import { initTelegramBot } from './telegram.js';
import { initScheduler, getSchedulerStatus } from './scheduler.js';
import telegramRouter from './routes/telegram.js';
import notificationsRouter from './routes/notifications.js';
import weatherRouter from './routes/weather.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 정적 파일 제공 (클라이언트 파일들)
app.use(express.static(path.join(__dirname, '../client')));

// API 라우터 설정
app.use('/api/telegram', telegramRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/weather', weatherRouter);

// 스케줄러 상태 조회 API
app.get('/api/scheduler/status', (req, res) => {
  res.json(getSchedulerStatus());
});

// 테스트용 API
app.get('/api/test', (req, res) => {
  res.json({
    message: '텔레알림 서버가 정상 작동 중입니다!',
    timestamp: new Date().toISOString()
  });
});

// 모든 다른 요청은 index.html로 리다이렉트 (SPA 지원)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// 서버 초기화 및 시작
async function startServer() {
  try {
    await initDatabase();
    await initTelegramBot();
    await initScheduler();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 텔레알림 서버가 http://0.0.0.0:${PORT} 에서 실행 중입니다.`);
      console.log(`📱 웹 인터페이스가 같은 URL에서 제공됩니다.`);
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
}

startServer();