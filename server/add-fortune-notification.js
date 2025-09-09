// server/add-fortune-notification.js - 운세 알림 추가
import { db } from './database.js';

async function addFortuneNotification() {
  console.log('🔮 운세 알림을 추가합니다...');
  
  return new Promise((resolve, reject) => {
    // 매일 오전 9시에 운세 알림 추가
    db.run(
      `INSERT INTO notifications (
        title, 
        message, 
        schedule_type, 
        schedule_time, 
        is_active,
        created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [
        '오늘의 운세',
        '', // 운세 메시지는 동적으로 생성됨
        'fortune',
        '09:00',
        1
      ],
      function(err) {
        if (err) {
          console.error('❌ 운세 알림 추가 실패:', err.message);
          reject(err);
          return;
        }
        
        console.log(`✅ 운세 알림이 추가되었습니다. ID: ${this.lastID}`);
        console.log('⏰ 매일 오전 9시에 운세 알림이 발송됩니다.');
        resolve(this.lastID);
      }
    );
  });
}

addFortuneNotification()
  .then(() => {
    console.log('\n✅ 운세 알림 추가 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 추가 실패:', error);
    process.exit(1);
  });