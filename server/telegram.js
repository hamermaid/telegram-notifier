// server/telegram.js
import TelegramBot from 'node-telegram-bot-api';
import { db } from './database.js';

let bot = null;

// 텔레그램 봇 초기화
export function initTelegramBot() {
  return new Promise((resolve, reject) => {
    db.get('SELECT bot_token FROM telegram_settings WHERE id = 1', (err, row) => {
      if (err) {
        console.log('❌ 텔레그램 설정을 불러올 수 없습니다:', err);
        resolve(false);
        return;
      }

      if (!row || !row.bot_token) {
        console.log('⚠️ 텔레그램 봇 토큰이 설정되지 않았습니다.');
        resolve(false);
        return;
      }

      try {
        bot = new TelegramBot(row.bot_token, { polling: false });
        console.log('✅ 텔레그램 봇이 연결되었습니다.');
        resolve(true);
      } catch (error) {
        console.log('❌ 텔레그램 봇 연결 실패:', error.message);
        resolve(false);
      }
    });
  });
}

// 메시지 전송 함수
export async function sendMessage(message) {
  return new Promise((resolve, reject) => {
    if (!bot) {
      reject(new Error('텔레그램 봇이 초기화되지 않았습니다.'));
      return;
    }

    // 채팅 ID 가져오기
    db.get('SELECT chat_id FROM telegram_settings WHERE id = 1', (err, row) => {
      if (err || !row || !row.chat_id) {
        reject(new Error('채팅 ID가 설정되지 않았습니다.'));
        return;
      }

      // 메시지 전송
      bot.sendMessage(row.chat_id, message)
      .then((result) => {
        console.log('📱 메시지 전송 성공:', message);
        resolve(result);
      })
      .catch((error) => {
        console.log('❌ 메시지 전송 실패:', error.message);
        reject(error);
      });
    });
  });
}

// 봇 테스트 함수
export async function testBot() {
  try {
    await sendMessage('🤖 텔레알림봇이 성공적으로 연결되었습니다!\n이제 알림을 받을 수 있어요.');
    return true;
  } catch (error) {
    console.log('봇 테스트 실패:', error.message);
    return false;
  }
}