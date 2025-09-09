// server/add-immediate-fortune.js - 즉시 실행할 운세 알림 추가
import { db } from './database.js';

async function addImmediateFortuneNotification() {
  console.log('🔮 즉시 실행 운세 알림을 추가합니다...');
  
  // 현재 시간에서 1분 후로 설정
  const now = new Date();
  const testTime = new Date(now.getTime() + 60000); // 1분 후
  const timeString = testTime.toTimeString().substring(0, 5); // HH:MM 형식
  
  console.log(`⏰ 실행 시간: ${timeString}`);
  
  return new Promise((resolve, reject) => {
    // 기존 테스트 알림들 먼저 삭제
    db.run('DELETE FROM notifications WHERE title LIKE "테스트%"', (err) => {
      if (err) {
        console.error('❌ 기존 테스트 알림 삭제 실패:', err.message);
      }
      
      // 새 테스트 알림 추가
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
          '즉시테스트운세',
          '', // 운세 메시지는 동적으로 생성됨
          'fortune',
          timeString,
          1
        ],
        function(err) {
          if (err) {
            console.error('❌ 즉시 운세 알림 추가 실패:', err.message);
            reject(err);
            return;
          }
          
          console.log(`✅ 즉시 운세 알림이 추가되었습니다. ID: ${this.lastID}`);
          console.log(`⏰ ${timeString}에 운세 알림이 발송됩니다.`);
          resolve(this.lastID);
        }
      );
    });
  });
}

addImmediateFortuneNotification()
  .then(() => {
    console.log('\n✅ 즉시 운세 알림 추가 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 추가 실패:', error);
    process.exit(1);
  });