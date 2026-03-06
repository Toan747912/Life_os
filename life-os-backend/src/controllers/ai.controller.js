const aiService = require('../services/ai.service');

const generateStory = async (req, res) => {
    try {
        const { words, difficulty } = req.body;
        if (!words || !Array.isArray(words) || words.length === 0) {
            return res.status(400).json({ error: "Yêu cầu mảng 'words'" });
        }

        const result = await aiService.generateStoryWithGemini(words, difficulty || 'B1', req.query.modelId);
        res.json({ message: "Sinh truyện thành công", data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const generateCloze = async (req, res) => {
    try {
        const { sentences } = req.body;
        if (!sentences || !Array.isArray(sentences) || sentences.length === 0) {
            return res.status(400).json({ error: "Yêu cầu mảng 'sentences'" });
        }

        const result = await aiService.generateClozeWithGemini(sentences, req.query.modelId);
        res.json({ message: "Sinh bài tập điền từ thành công", data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    generateStory,
    generateCloze
};
