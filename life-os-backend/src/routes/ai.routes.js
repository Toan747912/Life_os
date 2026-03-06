const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

router.post('/story', aiController.generateStory);
router.post('/cloze', aiController.generateCloze);

module.exports = router;
