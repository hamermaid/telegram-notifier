// server/app.js
import express from 'express';
import cors from 'cors';
import { initDatabase } from './database.js';  // ← 이 줄이 있는지 확인
import { initTelegramBot } from './telegram.js';
import { initScheduler, getSchedulerStatus } from './scheduler.js';
import telegramRouter from './routes/telegram.js';
import notificationsRouter from './routes/notifications.js';
import weatherRouter from './routes/weather.js';  // ← 새로 추가

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 라우터 설정
app.use('/api/telegram', telegramRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/weather', weatherRouter);  // ← 새로 추가

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

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    name: 'Telegram Notifier Server',
    status: 'running',
    port: PORT
  });
});

// 서버 초기화 및 시작
async function startServer() {
  try {
    // 데이터베이스 초기화
    await initDatabase();  // ← 이 함수가 호출되는 부분

    // 텔레그램 봇 초기화 (설정이 있다면)
    await initTelegramBot();

    // 스케줄러 초기화
    await initScheduler();

    // 서버 시작
    app.listen(PORT, () => {
      console.log(`🚀 텔레알림 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
      console.log(`📱 클라이언트는 http://localhost:3000 에서 확인하세요.`);
      console.log(`🚀 텔레알림 서버가 http://0.0.0.0:${PORT} 에서 실행 중입니다.`);
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
}

startServer();