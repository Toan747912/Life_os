const taskService = require('../services/task.service');

// GET /api/tasks?userId=...&date=...
const getDailyTasks = async (req, res) => {
    try {
        const userId = req.user?.id || req.query?.userId;

        // Kiểm tra nếu không có userId thì báo lỗi luôn
        if (!userId) {
            return res.status(400).json({ error: "Thiếu userId. Vui lòng truyền ?userId=..." });
        }

        // Mặc định lấy ngày hiện tại nếu không truyền date
        const date = req.query.date || new Date().toISOString();

        const tasks = await taskService.getTasksByDate(userId, date);

        return res.json({
            message: "Lấy danh sách task thành công",
            count: tasks.length,
            data: tasks
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// PATCH /api/tasks/:id/toggle
const toggleTask = async (req, res) => {
    try {
        const userId = req.user?.id || req.body?.userId || req.query?.userId;
        const taskId = req.params.id;

        if (!userId) {
            return res.status(400).json({ error: "Thiếu userId" });
        }

        const updatedTask = await taskService.toggleTaskStatus(taskId, userId);
        return res.json({ message: "Cập nhật trạng thái thành công", data: updatedTask });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

module.exports = { getDailyTasks, toggleTask };