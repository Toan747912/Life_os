const express = require('express');
const router = express.Router();
const dictationController = require('../controllers/dictation.controller');
const authenticate = require('../middleware/auth');
const multer = require('multer');

// Cấu hình multer cho file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

// Tất cả routes đều cần auth
router.use(authenticate);

// Routes
router.get('/', dictationController.getAllDictations);
router.get('/:id', dictationController.getDictationById);
router.post('/', upload.single('audio'), dictationController.createDictation);
router.post('/:id/submit', dictationController.submitDictation);
router.get('/:dictationId/attempts', dictationController.getUserAttempts);
router.post('/analyze', upload.single('audio'), dictationController.analyzeAudio);
router.post('/analyze-youtube', dictationController.analyzeYouTube);
router.post('/save', dictationController.saveDictation);
router.put('/:id', dictationController.updateDictation);
router.delete('/:id', dictationController.deleteDictation);

module.exports = router;