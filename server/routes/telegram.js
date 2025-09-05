// server/routes/telegram.js
import express from 'express';
import { db } from '../database.js';
import { initTelegramBot, testBot } from '../telegram.js';

const router = express.Router();

// 텔레그램 설정 조회
router.get('/settings', (req, res) => {
  db.get('SELECT bot_token, chat_id FROM telegram_settings WHERE id = 1', (err, row) => {
    if (err) {
      res.status(500).json({ error: '설정을 불러올 수 없습니다.' });
      return;
    }

    // 토큰은 보안을 위해 일부만 표시
    const maskedToken = row?.bot_token ?
        row.bot_token.substring(0, 10) + '...' + row.bot_token.slice(-4) : null;

    res.json({
      bot_token: maskedToken,
      chat_id: row?.chat_id || null,
      is_configured: !!(row?.bot_token && row?.chat_id)
    });
  });
});

// 텔레그램 설정 저장
router.post('/settings', (req, res) => {
  const { bot_token, chat_id } = req.body;

  if (!bot_token || !chat_id) {
    res.status(400).json({ error: '봇 토큰과 채팅 ID가 필요합니다.' });
    return;
  }

  db.run(
      'UPDATE telegram_settings SET bot_token = ?, chat_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
      [bot_token, chat_id],
      async function(err) {
        if (err) {
          res.status(500).json({ error: '설정 저장에 실패했습니다.' });
          return;
        }

        // 봇 재초기화
        const botInitialized = await initTelegramBot();

        res.json({
          success: true,
          message: '텔레그램 설정이 저장되었습니다.',
          bot_initialized: botInitialized
        });
      }
  );
});

// 봇 테스트
router.post('/test', async (req, res) => {
  try {
    const success = await testBot();
    if (success) {
      res.json({
        success: true,
        message: '테스트 메시지가 전송되었습니다!'
      });
    } else {
      res.status(400).json({
        success: false,
        message: '테스트 메시지 전송에 실패했습니다.'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;