const express = require('express');
const router = express.Router();
const insightController = require('../controllers/insight.controller');

// All insight routes require authentication (added in app.js authMiddleware)

router.post('/generate', insightController.generateLearningInsight);

router
    .route('/')
    .post(insightController.createInsight)
    .get(insightController.getInsights);

router
    .route('/:id')
    .patch(insightController.updateInsight)
    .delete(insightController.deleteInsight);

module.exports = router;
