const express = require('express');
const router = express.Router();
const deckController = require('../controllers/deck.controller');

router.post('/', deckController.createDeck);
router.get('/', deckController.getUserDecks);
router.get('/:id', deckController.getDeckById);
router.put('/:id', deckController.updateDeck);
router.delete('/:id', deckController.deleteDeck);

router.post('/:id/items', deckController.addItemsToDeck);
router.delete('/:id/items', deckController.removeItemsFromDeck);

module.exports = router;
