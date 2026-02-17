const express = require('express');
const router = express.Router();
const learningController = require('../controllers/learning.controller');

console.log(learningController);

router.post('/analyze', learningController.analyzeAndSave);

module.exports = router;