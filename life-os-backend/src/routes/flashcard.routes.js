const express = require('express');
const router = express.Router();
const flashcardController = require('../controllers/flashcard.controller');

router.get('/due', flashcardController.getDueFlashcards);
router.post('/review/:id', flashcardController.reviewFlashcard);

module.exports = router;
