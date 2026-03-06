const express = require('express');
const router = express.Router();
const vocabularyController = require('../controllers/vocabulary.controller');

router.post('/', vocabularyController.addVocabulary);
router.get('/', vocabularyController.getVocabularies);
router.delete('/:id', vocabularyController.deleteVocabulary);

module.exports = router;
