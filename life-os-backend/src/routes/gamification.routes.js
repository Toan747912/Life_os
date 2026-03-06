const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamification.controller');

router.get('/dashboard', gamificationController.getDashboardData);
router.post('/xp', gamificationController.addXP);
router.post('/quests/progress', gamificationController.updateQuestProgress);
router.post('/goals', gamificationController.createGoal);
router.put('/goals/:goalId/progress', gamificationController.updateGoalProgress);

module.exports = router;
