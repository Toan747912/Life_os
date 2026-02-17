const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// Import hàm AI của bạn (giả sử bạn đã tách ra file riêng)
const { analyzeTextWithGemini } = require('../services/ai.service'); 

const createLearningResource = async (userId, textContent, title) => {
  try {
    // 1. Gọi AI phân tích (Bước này tốn thời gian nhất)
    console.log("🤖 Đang gửi cho Gemini phân tích...");
    const aiResult = await analyzeTextWithGemini(textContent);
    
    // Giả sử aiResult trả về object: 
    // { summary, difficulty, keywords, vocabularyList: [...] }

    // 2. Dùng Transaction để lưu vào DB an toàn
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Tạo Resource mới
      const newResource = await tx.resource.create({
        data: {
          userId: userId,
          title: title,
          type: "TEXT",
          content: textContent,
          summary: aiResult.summary,
          difficulty: aiResult.difficulty,
          metadata: { keywords: aiResult.keywords }, // Lưu JSON
          
          // Tạo luôn các LearningItem (Từ vựng) đi kèm
          learningItems: {
            create: aiResult.vocabularyList.map(item => ({
              term: item.word,
              definition: item.definition,
              type: "VOCABULARY",
              userId: userId
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
          resourceId: newResource.id, // Link với tài liệu vừa tạo
          title: `Ôn tập: ${title}`,
          description: `Review từ vựng và tóm tắt của bài ${title}`,
          priority: "HIGH",
          dueDate: tomorrow,
          status: "TODO"
        }
      });

      return { resource: newResource, task: newTask };
    });

    console.log("✅ Đã lưu Resource và tạo Task thành công!");
    return result;

  } catch (error) {
    console.error("❌ Lỗi quy trình:", error);
    throw error;
  }
};

module.exports = { createLearningResource };