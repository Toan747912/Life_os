const learningService = require('../services/learning.service');
const contentService = require('../services/content.service');

const analyzeAndSave = async (req, res) => {
  try {
    const userId = req.user.id;
    let { content, title, type, modelId } = req.body;
    console.log("Process request for userId:", userId);
    let finalContent = content;

    // Nếu có file upload (PDF/Image)
    if (req.file) {
      // type sẽ được gửi kèm hoặc tự định nghĩa
      type = 'PDF';
      finalContent = await contentService.extractContent('PDF', req.file.buffer);
      title = title || req.file.originalname;
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

    // Gọi service cũ để chạy AI, truyền thêm URL nguồn nếu có
    const sourceUrl = type === 'YOUTUBE' ? content : null;
    const data = await learningService.createLearningResource(userId, finalContent, title, modelId, sourceUrl);

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

module.exports = {
  analyzeAndSave,
  getResources,
  getResourceDetail,
  getTodayReviews,
  updateReview,
  getModels,
  evaluateWriting
};