// src/controllers/learning.controller.js
const learningService = require('../services/learning.service');

const analyzeAndSave = async (req, res) => {
  try {
    const { userId, content, title } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ error: "Thiếu userId hoặc content" });
    }

    // Gọi service
    const data = await learningService.createLearningResource(userId, content, title || "Untitled Document");

    return res.status(201).json({
      message: "Phân tích và tạo Task thành công",
      data: data
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { analyzeAndSave };