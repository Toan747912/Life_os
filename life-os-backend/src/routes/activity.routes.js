const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');

router.post('/log', activityController.logActivity);
router.get('/streak', activityController.getStreak);
router.get('/heatmap', activityController.getHeatmap);
router.get('/quests', activityController.getQuests);

module.exports = router;
