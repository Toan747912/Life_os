const express = require('express');
const multer = require('multer');
const router = express.Router();
const learningController = require('../controllers/learning.controller');


router.post('/analyze', learningController.analyzeAndSave);

router.get('/', learningController.getResources);
router.get('/today-reviews', learningController.getTodayReviews);
router.get('/models', learningController.getModels);
router.get('/:id', learningController.getResourceDetail);
router.patch('/items/:id/review', learningController.updateReview);

router.post('/evaluate-writing', learningController.evaluateWriting);

const upload = multer({ storage: multer.memoryStorage() });
router.post('/upload', upload.single('file'), learningController.analyzeAndSave);

module.exports = router;