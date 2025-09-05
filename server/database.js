// server/database.js
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// data 폴더가 없으면 생성
const dataDir = join(__dirname, 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'notifier.db');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 데이터베이스 연결 실패:', err.message);
  } else {
    console.log('✅ SQLite 데이터베이스에 연결되었습니다.');
  }
});

export async function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 텔레그램 설정 테이블
      db.run(`
          CREATE TABLE IF NOT EXISTS telegram_settings (
                                                           id INTEGER PRIMARY KEY,
                                                           bot_token TEXT,
                                                           chat_id TEXT,
                                                           created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                                           updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
      `);

      // 기본 설정 행 삽입 (없을 때만)
      db.run(`
          INSERT OR IGNORE INTO telegram_settings (id, bot_token, chat_id) 
        VALUES (1, NULL, NULL)
      `);

      // 습관/알림 테이블
      db.run(`
          CREATE TABLE IF NOT EXISTS notifications (
                                                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                       title TEXT NOT NULL,
                                                       message TEXT,
                                                       schedule_type TEXT NOT NULL,
                                                       schedule_time TEXT NOT NULL,
                                                       schedule_days TEXT,
                                                       schedule_date TEXT,         
                                                       is_active BOOLEAN DEFAULT 1,
                                                       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                                       updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
      `);

      // 날씨 설정 테이블
      db.run(`
          CREATE TABLE IF NOT EXISTS weather_settings (
                                                          id INTEGER PRIMARY KEY,
                                                          api_key TEXT,
                                                          city TEXT DEFAULT 'Seoul',
                                                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                                          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
      `);

      // 하루 운세 테이블
      db.run(`
          CREATE TABLE IF NOT EXISTS daily_fortunes (
                                                       id INTEGER PRIMARY KEY,
                                                       message TEXT NOT NULL,
                                                       lucky_item VARCHAR(255) NOT NULL,
                                                      lucky_color_name VARCHAR(50) NOT NULL,
                                                      lucky_color_code VARCHAR(7) NOT NULL,
                                                      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
      `);

      // 기본 날씨 설정 행 삽입 (없을 때만)
      db.run(`
          INSERT OR IGNORE INTO weather_settings (id, api_key, city) 
  VALUES (1, NULL, 'Seoul')
      `);

      // 알림 전송 로그 테이블
      db.run(`
          CREATE TABLE IF NOT EXISTS notification_logs (
                                                           id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                           notification_id INTEGER,
                                                           sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                                           message TEXT,
                                                           status TEXT DEFAULT 'success', -- success, failed
                                                           FOREIGN KEY (notification_id) REFERENCES notifications (id)
              )
      `, (err) => {
        if (err) {
          console.error('❌ 테이블 생성 실패:', err);
          reject(err);
        } else {
          console.log('✅ 데이터베이스 테이블이 준비되었습니다.');
          resolve();
        }
      });
    });
  });
}