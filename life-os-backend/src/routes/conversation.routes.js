const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversation.controller');

router.get('/', conversationController.getUserConversations);
router.post('/', conversationController.startConversation);
router.post('/:conversationId/messages', conversationController.sendMessage);
router.post('/:conversationId/evaluate', conversationController.evaluateConversation);

module.exports = router;
