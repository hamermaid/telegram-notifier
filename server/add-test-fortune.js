// server/add-test-fortune.js - 즉시 테스트할 운세 알림 추가
import { db } from './database.js';

async function addTestFortuneNotification() {
  console.log('🔮 테스트 운세 알림을 추가합니다...');
  
  // 현재 시간에서 1분 후로 설정
  const now = new Date();
  const testTime = new Date(now.getTime() + 60000); // 1분 후
  const timeString = testTime.toTimeString().substring(0, 5); // HH:MM 형식
  
  console.log(`⏰ 테스트 시간: ${timeString}`);
  
  return new Promise((resolve, reject) => {
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
        '테스트 운세',
        '', // 운세 메시지는 동적으로 생성됨
        'fortune',
        timeString,
        1
      ],
      function(err) {
        if (err) {
          console.error('❌ 테스트 운세 알림 추가 실패:', err.message);
          reject(err);
          return;
        }
        
        console.log(`✅ 테스트 운세 알림이 추가되었습니다. ID: ${this.lastID}`);
        console.log(`⏰ ${timeString}에 운세 알림이 발송됩니다.`);
        resolve(this.lastID);
      }
    );
  });
}

addTestFortuneNotification()
  .then(() => {
    console.log('\n✅ 테스트 운세 알림 추가 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 추가 실패:', error);
    process.exit(1);
  });