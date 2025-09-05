// server/scheduler.js
import cron from 'node-cron';
import { db } from './database.js';
import { sendMessage } from './telegram.js';

// 활성화된 cron 작업들을 저장
let activeTasks = new Map();

// 스케줄러 초기화
export async function initScheduler() {
  console.log('🕐 스케줄러를 초기화합니다...');
  await loadAndStartTasks();
}

// 스케줄러 재시작 (설정 변경 시)
export async function restartScheduler() {
  console.log('🔄 스케줄러를 재시작합니다...');

  // 기존 작업들 모두 중지
  stopAllTasks();

  // 새로 시작
  await loadAndStartTasks();
}

// 모든 활성 작업 중지
function stopAllTasks() {
  activeTasks.forEach((task, id) => {
    try {
      task.stop();
    } catch (error) {
      console.warn(`작업 ${id} 중지 중 오류:`, error.message);
    }
  });
  activeTasks.clear();
  console.log('🛑 모든 스케줄 작업이 중지되었습니다.');
}

// 데이터베이스에서 알림을 불러와서 스케줄 작업 시작
async function loadAndStartTasks() {
  return new Promise((resolve, reject) => {
    db.all(
        'SELECT * FROM notifications WHERE is_active = 1',
        (err, notifications) => {
          if (err) {
            console.error('❌ 알림 목록 로드 실패:', err);
            reject(err);
            return;
          }

          console.log(`📋 ${notifications.length}개의 활성 알림을 발견했습니다.`);

          notifications.forEach(notification => {
            try {
              createCronTask(notification);
            } catch (error) {
              console.error(`❌ 알림 ID ${notification.id} 스케줄 생성 실패:`, error.message);
            }
          });

          console.log(`✅ ${activeTasks.size}개의 스케줄 작업이 시작되었습니다.`);
          resolve();
        }
    );
  });
}

// 개별 알림에 대한 cron 작업 생성
function createCronTask(notification) {
  const cronExpression = buildCronExpression(notification);

  if (!cronExpression) {
    console.warn(`⚠️ 알림 ID ${notification.id}: 잘못된 스케줄 설정`);
    return;
  }

  // cron 표현식이 유효한지 검증
  if (!cron.validate(cronExpression)) {
    console.error(`❌ 알림 ID ${notification.id}: 잘못된 cron 표현식 - ${cronExpression}`);
    return;
  }

  try {
    // cron 작업 생성
    const task = cron.schedule(cronExpression, async () => {
      await executeNotification(notification);
    }, {
      scheduled: true,
      timezone: 'Asia/Seoul'
    });

    // 활성 작업 목록에 추가
    activeTasks.set(notification.id, task);

    console.log(`📅 알림 "${notification.title}" 스케줄 등록: ${cronExpression} (타입: ${notification.schedule_type})`);
  } catch (error) {
    console.error(`❌ 알림 ID ${notification.id} cron 작업 생성 실패:`, error.message);
  }
}

// 알림 설정을 cron 표현식으로 변환
function buildCronExpression(notification) {
  try {
    const [hour, minute] = notification.schedule_time.split(':').map(Number);

    // 시간 유효성 검사
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      console.error(`❌ 잘못된 시간 형식: ${notification.schedule_time}`);
      return null;
    }

    console.log(`🔍 스케줄 타입 처리: ${notification.schedule_type}`);

    switch (notification.schedule_type) {
      case 'daily':
        // 매일 지정된 시간
        console.log(`📅 매일 스케줄: ${minute} ${hour} * * *`);
        return `${minute} ${hour} * * *`;

      case 'weekly':
        // 주간 반복 (지정된 요일들)
        if (!notification.schedule_days) {
          console.error(`❌ 주간 스케줄에 요일이 지정되지 않음`);
          return null;
        }
        const days = notification.schedule_days; // "1,3,5" 형태
        console.log(`📅 주간 스케줄: ${minute} ${hour} * * ${days}`);
        return `${minute} ${hour} * * ${days}`;

      case 'weather':
        // 날씨 기반 - 매일 해당 시간에 체크하고 조건 만족시에만 전송
        console.log(`🌤️ 날씨 기반 스케줄: ${minute} ${hour} * * * (조건: ${notification.schedule_days})`);
        return `${minute} ${hour} * * *`;

      case 'date_once':
        // 특정 날짜 한 번만 - 해당 날짜에만 실행
        if (!notification.schedule_date) {
          console.error(`❌ 일회성 날짜 스케줄에 날짜가 지정되지 않음`);
          return null;
        }
        const [year, month, day] = notification.schedule_date.split('-').map(Number);
        console.log(`📅 일회성 날짜 스케줄: ${minute} ${hour} ${day} ${month} * (${notification.schedule_date})`);
        return `${minute} ${hour} ${day} ${month} *`;

      case 'date_yearly':
        // 매년 반복 (기념일, 생일 등)
        if (!notification.schedule_date) {
          console.error(`❌ 연간 반복 스케줄에 날짜가 지정되지 않음`);
          return null;
        }
        const [, yearlyMonth, yearlyDay] = notification.schedule_date.split('-').map(Number);
        console.log(`🎂 연간 반복 스케줄: ${minute} ${hour} ${yearlyDay} ${yearlyMonth} * (매년 ${yearlyMonth}월 ${yearlyDay}일)`);
        return `${minute} ${hour} ${yearlyDay} ${yearlyMonth} *`;

      case 'custom':
        // 사용자 정의 (현재는 매일과 동일)
        console.log(`📅 커스텀 스케줄: ${minute} ${hour} * * *`);
        return `${minute} ${hour} * * *`;

      default:
        console.error(`❌ 알 수 없는 스케줄 타입: ${notification.schedule_type}`);
        return null;
    }
  } catch (error) {
    console.error(`❌ cron 표현식 생성 중 오류:`, error.message);
    return null;
  }
}

// 알림 실행
async function executeNotification(notification) {
  try {
    console.log(`🔔 알림 실행 시도: "${notification.title}" (타입: ${notification.schedule_type})`);

    // 일회성 날짜 알림인 경우 날짜 확인 후 비활성화
    if (notification.schedule_type === 'date_once') {
      const targetDate = new Date(notification.schedule_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);

      if (targetDate < today) {
        console.log(`📅 일회성 알림 날짜가 지났으므로 비활성화: "${notification.title}"`);
        await deactivateNotification(notification.id);
        return;
      }
    }

    // 날씨 기반 알림인 경우 조건 확인
    if (notification.schedule_type === 'weather') {
      const shouldSend = await checkWeatherCondition(notification);
      if (!shouldSend) {
        console.log(`⏭️ 날씨 조건 불만족으로 알림 스킵: "${notification.title}"`);
        await logNotification(notification.id, `날씨 조건 불만족으로 스킵`, 'skipped');
        return;
      }
    }

    console.log(`🔔 알림 실행: "${notification.title}"`);

    // 메시지 구성
    let message = `🔔 ${notification.title}`;
    if (notification.message) {
      message += `\n\n${notification.message}`;
    }

    // 날짜 기반 알림 정보 추가
    if (notification.schedule_type === 'date_yearly') {
      const today = new Date();
      const targetDate = new Date(notification.schedule_date);
      const years = today.getFullYear() - targetDate.getFullYear();
      if (years > 0) {
        message += `\n\n🎂 ${years}주년을 축하합니다!`;
      }
    }

    // 날씨 기반 알림인 경우 현재 날씨 정보 추가
    if (notification.schedule_type === 'weather') {
      const weatherInfo = await getWeatherInfoForMessage();
      if (weatherInfo) {
        message += `\n\n${weatherInfo}`;
      }
    }

    message += `\n\n⏰ ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`;

    // 텔레그램으로 메시지 전송
    await sendMessage(message);

    // 일회성 알림인 경우 전송 후 비활성화
    if (notification.schedule_type === 'date_once') {
      console.log(`📅 일회성 알림 전송 완료, 비활성화: "${notification.title}"`);
      await deactivateNotification(notification.id);
    }

    // 로그 기록
    await logNotification(notification.id, message, 'success');

    console.log(`✅ 알림 전송 완료: "${notification.title}"`);

  } catch (error) {
    console.error(`❌ 알림 전송 실패: "${notification.title}"`, error.message);

    // 실패 로그 기록
    await logNotification(notification.id, error.message, 'failed');
  }
}

// 알림 비활성화 (일회성 알림용)
async function deactivateNotification(notificationId) {
  return new Promise((resolve) => {
    db.run(
        'UPDATE notifications SET is_active = 0 WHERE id = ?',
        [notificationId],
        (err) => {
          if (err) {
            console.error('알림 비활성화 실패:', err.message);
          } else {
            console.log(`📅 알림 ID ${notificationId} 비활성화 완료`);
          }
          resolve();
        }
    );
  });
}

// 날씨 조건 확인
async function checkWeatherCondition(notification) {
  try {
    console.log(`🌤️ 날씨 조건 확인 중: ${notification.schedule_days}`);

    // 동적 import로 weather.js 모듈 가져오기
    const { getCurrentWeather, checkRainForecast } = await import('./weather.js');

    const condition = notification.schedule_days; // rain, cold, hot, humid

    switch (condition) {
      case 'rain':
        const rainForecast = await checkRainForecast();
        console.log(`☔ 비 확률: ${rainForecast.max_rain_probability}%, 우산 필요: ${rainForecast.should_bring_umbrella}`);
        return rainForecast.should_bring_umbrella;

      case 'cold':
        const coldWeather = await getCurrentWeather();
        console.log(`🥶 현재 기온: ${coldWeather.temperature}°C, 추위 조건 (≤10°C): ${coldWeather.temperature <= 10}`);
        return coldWeather.temperature <= 10;

      case 'hot':
        const hotWeather = await getCurrentWeather();
        console.log(`🔥 현재 기온: ${hotWeather.temperature}°C, 더위 조건 (≥25°C): ${hotWeather.temperature >= 25}`);
        return hotWeather.temperature >= 25;

      case 'humid':
        const humidWeather = await getCurrentWeather();
        console.log(`💧 현재 습도: ${humidWeather.humidity}%, 습도 조건 (≥80%): ${humidWeather.humidity >= 80}`);
        return humidWeather.humidity >= 80;

      default:
        console.warn(`⚠️ 알 수 없는 날씨 조건: ${condition}`);
        return false;
    }
  } catch (error) {
    console.error(`❌ 날씨 조건 확인 실패:`, error.message);
    return false; // 날씨 정보를 가져올 수 없으면 알림 보내지 않음
  }
}

// 날씨 정보를 메시지에 추가할 형태로 가져오기
async function getWeatherInfoForMessage() {
  try {
    const { getCurrentWeather, checkRainForecast } = await import('./weather.js');

    const weather = await getCurrentWeather();
    const rainForecast = await checkRainForecast();

    let weatherText = `🌤️ 현재 ${weather.city} ${weather.temperature}°C`;

    if (rainForecast.should_bring_umbrella) {
      weatherText += ` | ☔ 강수확률 ${rainForecast.max_rain_probability}%`;
    }

    return weatherText;
  } catch (error) {
    console.error('날씨 정보 가져오기 실패:', error.message);
    return null;
  }
}

// 알림 전송 로그 기록
async function logNotification(notificationId, message, status) {
  return new Promise((resolve) => {
    db.run(
        'INSERT INTO notification_logs (notification_id, message, status) VALUES (?, ?, ?)',
        [notificationId, message, status],
        (err) => {
          if (err) {
            console.error('로그 기록 실패:', err.message);
          }
          resolve();
        }
    );
  });
}

// 현재 활성 작업 수 반환
export function getActiveTaskCount() {
  return activeTasks.size;
}

// 스케줄러 상태 정보 반환
export function getSchedulerStatus() {
  const tasks = [];
  activeTasks.forEach((task, id) => {
    try {
      tasks.push({
        id,
        running: task.running || false
      });
    } catch (error) {
      console.warn(`작업 ${id} 상태 조회 중 오류:`, error.message);
      tasks.push({
        id,
        running: false
      });
    }
  });

  return {
    active_tasks: activeTasks.size,
    tasks
  };
}