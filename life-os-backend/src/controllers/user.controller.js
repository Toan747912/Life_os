const userService = require('../services/user.service');
const habitService = require('../services/habit.service');

const getPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = await userService.getPreferences(userId);
        res.json({ data: preferences });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updatePreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = req.body;
        const updated = await userService.updatePreferences(userId, preferences);
        res.json({ message: "Preferences updated", data: updated.preferences });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getQuests = async (req, res) => {
    try {
        const userId = req.user.id;
        const quests = await habitService.getDailyQuestsStatus(userId);
        res.json({ data: quests });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await userService.getUserStats(userId);
        res.json({ data: stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getHeatmap = async (req, res) => {
    try {
        const userId = req.user.id;
        const heatmap = await habitService.getHeatmapData(userId);
        res.json({ data: heatmap });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getPreferences,
    updatePreferences,
    getQuests,
    getUserStats,
    getHeatmap
};
