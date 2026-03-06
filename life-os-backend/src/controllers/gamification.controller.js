const gamificationService = require('../services/gamification.service');

const getDashboardData = async (req, res) => {
    try {
        const data = await gamificationService.getDashboardData(req.user.id);
        res.json({ message: "Thành công", data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const addXP = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || typeof amount !== 'number') return res.status(400).json({ error: "Amount hợp lệ là bắt buộc" });
        const result = await gamificationService.addXP(req.user.id, amount);
        res.json({ message: "Thêm XP thành công", data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateQuestProgress = async (req, res) => {
    try {
        const { questType, progressAmount } = req.body;
        if (!questType) return res.status(400).json({ error: "Thiếu questType" });
        const result = await gamificationService.updateQuestProgress(req.user.id, questType, progressAmount);
        res.json({ message: "Cập nhật quest thành công", data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createGoal = async (req, res) => {
    try {
        const { title, target, deadline } = req.body;
        if (!title || !target) return res.status(400).json({ error: "Thiếu thông tin goal" });
        const goal = await gamificationService.createGoal(req.user.id, { title, target, deadline });
        res.status(201).json({ message: "Tạo Goal thành công", data: goal });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateGoalProgress = async (req, res) => {
    try {
        const { progressAmount } = req.body;
        if (progressAmount === undefined) return res.status(400).json({ error: "Thiếu progressAmount" });
        const goal = await gamificationService.updateGoalProgress(req.user.id, req.params.goalId, progressAmount);
        res.json({ message: "Cập nhật Goal thành công", data: goal });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getDashboardData,
    addXP,
    updateQuestProgress,
    createGoal,
    updateGoalProgress
};
