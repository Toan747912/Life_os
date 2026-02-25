const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const learningController = require('../controllers/learning.controller');


router.post('/analyze', learningController.analyzeAndSave);

router.get('/', learningController.getResources);
router.get('/today-reviews', learningController.getTodayReviews);
router.get('/dictation/reviews', learningController.getDictationReviews); // Dictation SRS
router.get('/models', learningController.getModels);
router.get('/:id', learningController.getResourceDetail);
router.patch('/items/:id/review', learningController.updateReview);
router.post('/dictation/submit', learningController.submitDictation); // Dictation Submit

router.post('/evaluate-writing', learningController.evaluateWriting);

router.post('/chat', learningController.chatWithAI);

// Cấu hình Multer để lưu file vào ổ đĩa để hỗ trợ file lớn (Audio/Video)
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // Giới hạn 50MB
});

router.post('/upload', upload.single('file'), learningController.analyzeAndSave);

module.exports = router;