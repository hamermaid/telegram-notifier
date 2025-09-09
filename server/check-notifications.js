// server/check-notifications.js - 알림 설정 확인
import { db } from './database.js';

async function checkNotifications() {
  console.log('📋 알림 설정을 확인합니다...');
  
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM notifications ORDER BY id',
      (err, notifications) => {
        if (err) {
          console.error('❌ 알림 조회 실패:', err.message);
          reject(err);
          return;
        }

        console.log(`📊 총 알림 개수: ${notifications.length}개`);
        
        notifications.forEach(notification => {
          console.log(`\n--- 알림 ID: ${notification.id} ---`);
          console.log(`제목: ${notification.title}`);
          console.log(`타입: ${notification.schedule_type}`);
          console.log(`활성: ${notification.is_active ? 'YES' : 'NO'}`);
          console.log(`시간: ${notification.schedule_time || 'N/A'}`);
          console.log(`요일: ${notification.schedule_days || 'N/A'}`);
          console.log(`날짜: ${notification.schedule_date || 'N/A'}`);
          console.log(`메시지: ${notification.message || 'N/A'}`);
        });
        
        resolve(notifications);
      }
    );
  });
}

checkNotifications()
  .then(() => {
    console.log('\n✅ 알림 확인 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 확인 실패:', error);
    process.exit(1);
  });