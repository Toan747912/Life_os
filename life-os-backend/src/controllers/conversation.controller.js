const conversationService = require('../services/conversation.service');

const startConversation = async (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic) return res.status(400).json({ error: "Thiếu chủ đề (topic)" });
        const result = await conversationService.startConversation(req.user.id, topic);
        res.status(201).json({ message: "Bắt đầu hội thoại thành công", data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "Thiếu tin nhắn" });
        const result = await conversationService.sendMessage(req.user.id, req.params.conversationId, message);
        res.json({ message: "Gửi tin nhắn thành công", data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const evaluateConversation = async (req, res) => {
    try {
        const result = await conversationService.endAndEvaluateConversation(req.user.id, req.params.conversationId);
        res.json({ message: "Đánh giá hội thoại thành công", data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUserConversations = async (req, res) => {
    try {
        const result = await conversationService.getUserConversations(req.user.id);
        res.json({ message: "Thành công", data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    startConversation,
    sendMessage,
    evaluateConversation,
    getUserConversations
};
