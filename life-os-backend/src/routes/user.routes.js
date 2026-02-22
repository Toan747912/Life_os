const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

router.get('/preferences', userController.getPreferences);
router.patch('/preferences', userController.updatePreferences);

// Habit Tracking Routes
router.get('/stats', userController.getUserStats);
router.get('/heatmap', userController.getHeatmap);
router.get('/quests', userController.getQuests);

module.exports = router;
