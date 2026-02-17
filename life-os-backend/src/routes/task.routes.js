const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller'); // Đảm bảo đường dẫn đúng

// Định nghĩa các đường dẫn con
// GET /api/tasks (Lấy danh sách task)
router.get('/', taskController.getDailyTasks);

// PATCH /api/tasks/:id/toggle (Đánh dấu hoàn thành/chưa hoàn thành)
router.patch('/:id/toggle', taskController.toggleTask);

module.exports = router;