// server/routes/notifications.js
import express from 'express';
import { db } from '../database.js';
import { restartScheduler } from '../scheduler.js';

const router = express.Router();

// 모든 알림 조회
router.get('/', (req, res) => {
  db.all(
    'SELECT * FROM notifications ORDER BY created_at DESC',
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: '알림 목록을 불러올 수 없습니다.' });
        return;
      }
      res.json(rows);
    }
  );
});

// 알림 추가
router.post('/', (req, res) => {
  const { title, message, schedule_type, schedule_time, schedule_days } = req.body;
  
  // 입력 검증
  if (!title || !schedule_type || !schedule_time) {
    res.status(400).json({ 
      error: '제목, 스케줄 타입, 시간은 필수입니다.' 
    });
    return;
  }
  
  db.run(
    `INSERT INTO notifications 
     (title, message, schedule_type, schedule_time, schedule_days) 
     VALUES (?, ?, ?, ?, ?)`,
    [title, message, schedule_type, schedule_time, schedule_days],
    async function(err) {
      if (err) {
        res.status(500).json({ error: '알림 저장에 실패했습니다.' });
        return;
      }
      
      // 스케줄러 재시작 (새로운 알림 반영)
      await restartScheduler();
      
      res.json({ 
        id: this.lastID,
        success: true, 
        message: '알림이 추가되었습니다.' 
      });
    }
  );
});

// 알림 수정
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, message, schedule_type, schedule_time, schedule_days, is_active } = req.body;
  
  db.run(
    `UPDATE notifications 
     SET title = ?, message = ?, schedule_type = ?, 
         schedule_time = ?, schedule_days = ?, is_active = ?,
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [title, message, schedule_type, schedule_time, schedule_days, is_active, id],
    async function(err) {
      if (err) {
        res.status(500).json({ error: '알림 수정에 실패했습니다.' });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: '알림을 찾을 수 없습니다.' });
        return;
      }
      
      // 스케줄러 재시작
      await restartScheduler();
      
      res.json({ 
        success: true, 
        message: '알림이 수정되었습니다.' 
      });
    }
  );
});

// 알림 삭제
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run(
    'DELETE FROM notifications WHERE id = ?',
    [id],
    async function(err) {
      if (err) {
        res.status(500).json({ error: '알림 삭제에 실패했습니다.' });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: '알림을 찾을 수 없습니다.' });
        return;
      }
      
      // 스케줄러 재시작
      await restartScheduler();
      
      res.json({ 
        success: true, 
        message: '알림이 삭제되었습니다.' 
      });
    }
  );
});

// 알림 활성화/비활성화 토글
router.patch('/:id/toggle', (req, res) => {
  const { id } = req.params;
  
  db.run(
    `UPDATE notifications 
     SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [id],
    async function(err) {
      if (err) {
        res.status(500).json({ error: '알림 상태 변경에 실패했습니다.' });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: '알림을 찾을 수 없습니다.' });
        return;
      }
      
      // 스케줄러 재시작
      await restartScheduler();
      
      res.json({ 
        success: true, 
        message: '알림 상태가 변경되었습니다.' 
      });
    }
  );
});

export default router;