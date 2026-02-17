// src/services/learning.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { analyzeTextWithGemini } = require('./ai.service');

/**
 * Service xử lý việc tạo tài liệu học tập và tự động lên lịch Task
 * @param {String} userId - ID của người dùng
 * @param {String} textContent - Nội dung văn bản cần học
 * @param {String} title - Tiêu đề bài học
 */
const createLearningResource = async (userId, textContent, title) => {
  try {
    // 1. Gọi AI phân tích
    console.log("🤖 [1/3] Đang gửi cho Gemini phân tích...");
    const aiResult = await analyzeTextWithGemini(textContent);

    // Validate dữ liệu từ AI tránh lỗi null
    const vocabList = Array.isArray(aiResult.vocabularyList) ? aiResult.vocabularyList : [];

    // 2. Dùng Transaction để đảm bảo tính toàn vẹn dữ liệu
    console.log("💾 [2/3] Đang lưu vào Database...");

    const result = await prisma.$transaction(async (tx) => {

      // A. Tạo Resource và LearningItems cùng lúc
      // Prisma hỗ trợ Nested Write (ghi lồng nhau) rất mạnh
      const newResource = await tx.resource.create({
        data: {
          userId: userId,
          title: title,
          type: "TEXT",
          rawContent: textContent,
          aiMetadata: {
            summary: aiResult.summary || "No summary",
            difficulty: aiResult.difficulty || "Medium",
            keywords: aiResult.keywords || []
          },

          // Tạo luôn các từ vựng đi kèm
          items: {
            create: vocabList.map(item => ({
              term: item.word || item.term,
              definition: item.definition,
              type: "VOCABULARY"
            }))
          }
        }
      });

      // B. TỰ ĐỘNG TẠO TASK (Life OS Magic ✨)
      // Logic: Tạo task nhắc ôn tập vào ngày mai
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1); // +1 ngày

      const newTask = await tx.task.create({
        data: {
          userId: userId,
          resourceId: newResource.id, // Link chặt chẽ với tài liệu vừa tạo
          title: `Ôn tập: ${title}`,
          description: `Review ${vocabList.length} từ vựng mới và tóm tắt.`,
          priority: "HIGH",
          dueDate: tomorrow,
          status: "TODO"
        }
      });

      return { resource: newResource, task: newTask };
    });

    console.log(`✅ [3/3] Xong! Resource ID: ${result.resource.id}, Task ID: ${result.task.id}`);
    return result;

  } catch (error) {
    console.error("❌ Lỗi quy trình createLearningResource:", error);
    throw error; // Ném lỗi ra để Controller bắt
  }
};

module.exports = { createLearningResource };