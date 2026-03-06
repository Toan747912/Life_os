const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const aiService = require('./ai.service');

const startConversation = async (userId, topic) => {
    return await prisma.conversation.create({
        data: {
            userId,
            topic,
            transcript: []
        }
    });
};

const sendMessage = async (userId, conversationId, userMessageText) => {
    const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId }
    });

    if (!conversation) throw new Error("Conversation not found");

    const messages = conversation.transcript || [];
    messages.push({ role: 'user', content: userMessageText });

    // Gọi AI
    const aiResponseText = await aiService.generateRoleplayResponseWithGemini(messages, conversation.topic);

    messages.push({ role: 'assistant', content: aiResponseText });

    await prisma.conversation.update({
        where: { id: conversationId },
        data: { transcript: messages }
    });

    return { userMessage: userMessageText, aiResponse: aiResponseText };
};

const endAndEvaluateConversation = async (userId, conversationId) => {
    // Để nâng cao, có thể gọi một prompt AI khác để chấm điểm cả đoạn chat
    const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId }
    });

    if (!conversation) throw new Error("Conversation not found");

    // Tạm thời hardcode logic đánh giá (hoặc bạn có thể gọi AI để chấm)
    const score = 85.0; // Điểm demo
    const feedback = { note: "Cố gắng sử dụng nhiều từ vựng đa dạng hơn." };

    return await prisma.conversation.update({
        where: { id: conversationId },
        data: { score, feedback }
    });
};

const getUserConversations = async (userId) => {
    return await prisma.conversation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });
};

module.exports = {
    startConversation,
    sendMessage,
    endAndEvaluateConversation,
    getUserConversations
};
