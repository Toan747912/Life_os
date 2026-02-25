const activityService = require('../services/activity.service');

exports.logActivity = async (req, res) => {
    try {
        const userId = req.user.id;
        const { action } = req.body;
        if (!action) return res.status(400).json({ error: 'Action is required' });

        const result = await activityService.logActivity(userId, action);
        if (!result) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(result);
    } catch (error) {
        console.error("❌ Error in logActivity:", error);
        res.status(500).json({ error: 'Failed to log activity' });
    }
};

exports.getStreak = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await activityService.getStreak(userId);
        res.status(200).json(result);
    } catch (error) {
        console.error("❌ Error in getStreak:", error);
        res.status(500).json({ error: 'Failed to get streak' });
    }
}

exports.getHeatmap = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await activityService.getHeatmap(userId);
        res.status(200).json(result);
    } catch (error) {
        console.error("❌ Error in getHeatmap:", error);
        res.status(500).json({ error: 'Failed to get heatmap' });
    }
}

exports.getQuests = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await activityService.getQuests(userId);
        res.status(200).json(result);
    } catch (error) {
        console.error("❌ Error in getQuests:", error);
        res.status(500).json({ error: 'Failed to get quests' });
    }
}
