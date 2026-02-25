const learningService = require('../services/learning.service');
const contentService = require('../services/content.service');
const aiService = require('../services/ai.service');
const fs = require('fs');

const analyzeAndSave = async (req, res) => {
  try {
    const userId = req.user.id;
    let { content, title, type, modelId } = req.body;
    console.log("Process request for userId:", userId);
    let finalContent = content;

    // Nếu có file upload (PDF/Image/Media)
    if (req.file) {
      const mime = req.file.mimetype;
      if (mime.startsWith('audio/') || mime.startsWith('video/')) {
        type = 'MEDIA';
        finalContent = req.file.path; // Pass file path for Gemini to upload
        title = title || req.file.originalname;
      } else {
        type = 'PDF';
        const fileBuffer = fs.readFileSync(req.file.path);
        finalContent = await contentService.extractContent('PDF', fileBuffer);
        title = title || req.file.originalname;
        // Clean up PDF temp file immediately
        fs.unlinkSync(req.file.path);
      }
    }
    // Nếu là Link YouTube
    else if (type === 'YOUTUBE') {
      finalContent = await contentService.extractContent('YOUTUBE', content);
    }
    // Nếu là Link Web
    else if (type === 'WEBSITE') {
      finalContent = await contentService.extractContent('WEBSITE', content);
    }

    if (!finalContent || finalContent.trim().length === 0) {
      return res.status(400).json({ error: "Không lấy được nội dung để phân tích" });
    }

    // Lấy Model mặc định từ Preferences nếu không gửi kèm modelId
    if (!modelId) {
      const userService = require('../services/user.service');
      const prefs = await userService.getPreferences(userId);
      modelId = prefs.defaultAiModel;
      console.log(`🔍 [ANALYSIS] Using default model from preferences: ${modelId}`);
    } else {
      console.log(`🔍 [ANALYSIS] Using modelId from request body: ${modelId}`);
    }

    if (!modelId) {
      modelId = 'gemini-2.0-flash'; // Hard fallback
      console.log(`⚠️ [ANALYSIS] No modelId found, falling back to: ${modelId}`);
    }

    // Gọi service cũ để chạy AI, truyền thêm URL nguồn và type
    const sourceUrl = type === 'YOUTUBE' ? content : null;
    const data = await learningService.createLearningResource(userId, finalContent, title, modelId, sourceUrl, type);

    res.status(201).json({ message: "Success", data });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getResources = async (req, res) => {
  try {
    // Lấy userId từ auth middleware (được đính kèm qua x-user-id header)
    const userId = req.user.id;
    const resources = await learningService.getAllResources(userId);
    res.json({ data: resources });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getResourceDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const resourceId = req.params.id;

    const resource = await learningService.getResourceById(resourceId, userId);

    if (!resource) {
      return res.status(404).json({ error: "Không tìm thấy tài liệu" });
    }

    res.json({ data: resource });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTodayReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = await learningService.getDueItems(userId);
    res.json({ data: items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDictationReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = await learningService.getDueDictationSentences(userId);
    res.json({ data: items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const submitDictation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { learningItemId, progressId, userInput, originalText, isCorrect } = req.body;

    if (!learningItemId || !progressId) {
      return res.status(400).json({ error: "Missing learningItemId or progressId" });
    }

    const data = await learningService.submitDictationAttempt(userId, learningItemId, progressId, userInput, originalText, isCorrect);

    res.json({ message: "Dictation attempt recorded", data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const progressId = req.params.id; // ID của bản ghi UserProgress
    const { result } = req.body; // 'remembered' hoặc 'forgot'

    if (!['remembered', 'forgot'].includes(result)) {
      return res.status(400).json({ error: "Kết quả phải là 'remembered' hoặc 'forgot'" });
    }

    const updated = await learningService.updateReviewProgress(userId, progressId, result);
    res.json({ message: "Cập nhật thành công", data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getModels = async (req, res) => {
  try {
    const { getAvailableModels } = require('../services/ai.service');
    const models = await getAvailableModels();
    res.json({ data: models });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const evaluateWriting = async (req, res) => {
  try {
    const userId = req.user.id;
    const { text, targetWords, modelId } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Nội dung bài viết không được để trống" });
    }

    const evaluation = await learningService.evaluateWritingPractice(userId, text, targetWords, modelId);

    res.status(200).json({ message: "Chấm điểm thành công", data: evaluation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const chatWithAI = async (req, res) => {
  try {
    const { messages, context, modelId } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Yêu cầu mảng messages" });
    }

    const responseText = await aiService.generateRoleplayResponse(messages, context, modelId);

    res.status(200).json({ data: responseText });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  analyzeAndSave,
  getResources,
  getResourceDetail,
  getTodayReviews,
  getDictationReviews, // New Dictation
  submitDictation,     // New Dictation
  updateReview,
  getModels,
  evaluateWriting,
  chatWithAI
};