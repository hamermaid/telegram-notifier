// server/fortune.js
import { db } from './database.js';

// 랜덤 운세 조회
export async function getRandomFortune() {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM daily_fortunes ORDER BY RANDOM() LIMIT 1',
      (err, fortune) => {
        if (err) {
          console.error('❌ 운세 조회 실패:', err.message);
          reject(err);
          return;
        }

        if (!fortune) {
          console.warn('⚠️ 운세 데이터가 없습니다.');
          // 기본 운세 반환
          resolve({
            message: '오늘은 새로운 시작의 날입니다! 긍정적인 마음으로 하루를 보내세요.',
            lucky_item: '행운의 열쇠',
            lucky_color_name: '파란색',
            lucky_color_code: '#007bff'
          });
          return;
        }

        console.log(`🔮 오늘의 운세 선택됨: ID ${fortune.id}`);
        resolve(fortune);
      }
    );
  });
}

// 운세 메시지 포맷팅
export function formatFortuneMessage(fortune) {
  const message = `🔮 **오늘의 운세**

💫 ${fortune.message}

🍀 **행운의 아이템**: ${fortune.lucky_item}
🎨 **행운의 색상**: ${fortune.lucky_color_name}

✨ 오늘 하루도 행운이 함께하길 바랍니다!`;

  return message;
}

// 모든 운세 개수 조회
export async function getFortuneCount() {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM daily_fortunes',
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result.count);
      }
    );
  });
}

// 운세 추가 (관리용)
export async function addFortune(message, luckyItem, luckyColorName, luckyColorCode) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO daily_fortunes (message, lucky_item, lucky_color_name, lucky_color_code) VALUES (?, ?, ?, ?)',
      [message, luckyItem, luckyColorName, luckyColorCode],
      function(err) {
        if (err) {
          console.error('❌ 운세 추가 실패:', err.message);
          reject(err);
          return;
        }
        
        console.log(`✅ 새 운세 추가됨 ID: ${this.lastID}`);
        resolve(this.lastID);
      }
    );
  });
}