// src/services/learning.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { analyzeTextWithGemini, evaluateWritingWithGemini } = require('./ai.service');
const habitService = require('./habit.service');

/**
 * Service xử lý việc tạo tài liệu học tập và tự động lên lịch Task
 * @param {String} userId - ID của người dùng
 * @param {String} textContent - Nội dung văn bản cần học
 * @param {String} sourceUrl - URL gốc (VD: Link YouTube)
 */
const createLearningResource = async (userId, textContent, title, modelId = null, sourceUrl = null, type = 'TEXT') => {
  try {
    // 1. Gọi AI phân tích
    let aiResult;
    if (type === 'MEDIA') {
      console.log(`🤖 [1/3] Đang gửi Media cho Gemini File AI (Model: ${modelId || 'default'})...`);
      const { analyzeMediaWithGemini } = require('./ai.service');
      aiResult = await analyzeMediaWithGemini(textContent, modelId);

      // Do not clean up the temporary file, we need it for playback
      // const fs = require('fs');
      // if (fs.existsSync(textContent)) {
      //   fs.unlinkSync(textContent);
      // }
    } else {
      console.log(`🤖 [1/3] Đang gửi cho Gemini phân tích (Model: ${modelId || 'default'})...`);
      aiResult = await analyzeTextWithGemini(textContent, modelId);
    }

    // Validate dữ liệu từ AI tránh lỗi null
    const vocabList = Array.isArray(aiResult.vocabularyList) ? aiResult.vocabularyList : [];
    const sentenceList = Array.isArray(aiResult.sentences) ? aiResult.sentences : [];

    // Chuẩn bị mảng LearningItems (bao gồm cả Vocab và Sentence)
    const learningItemsData = [
      // 1. Phân tích từ vựng
      ...vocabList.map(item => ({
        term: item.word || item.term || "Unknown word",
        definition: item.definition || "",
        exampleSentence: item.example || "",
        type: "VOCABULARY",
        extraInfo: {
          ipa: item.ipa || "",
          synonyms: item.synonyms || [],
          timestamp: item.timestamp || null
        }
      })),
      // 2. Phân tích câu thoại (dành cho Dictation)
      ...sentenceList.map(sentence => ({
        // Lưu tên hiển thị ngắn gọn cho term, VD: "[Câu thoại] Hello world..."
        term: `[Câu thoại] ${sentence.text ? sentence.text.substring(0, 30) : ''}...`,
        definition: sentence.translation || "",
        exampleSentence: sentence.text || "", // QUAN TRỌNG: Đây là câu gốc để Dictation kiểm tra
        type: "SENTENCE",
        extraInfo: {
          timestamp: sentence.timestamp || null
        }
      }))
    ];

    // 2. Dùng Transaction để đảm bảo tính toàn vẹn dữ liệu
    console.log("💾 [2/3] Đang lưu vào Database...");

    const result = await prisma.$transaction(async (tx) => {
      // A. Tạo Resource và LearningItems cùng lúc
      const path = require('path');
      const relativeFilePath = type === 'MEDIA' ? `uploads/${path.basename(textContent)}` : null;

      const newResource = await tx.resource.create({
        data: {
          userId: userId,
          title: title,
          type: type === 'MEDIA' ? "AUDIO" : (sourceUrl && (sourceUrl.includes('youtube.com') || sourceUrl.includes('youtu.be')) ? "YOUTUBE" : "TEXT"),
          filePath: relativeFilePath,
          rawContent: type === 'MEDIA' ? "Media File Analysis" : textContent,
          aiMetadata: {
            summary: aiResult.summary || "No summary",
            difficulty: aiResult.difficulty || "Medium",
            keywords: aiResult.keywords || [],
            vocabularyList: vocabList,
            sentences: sentenceList, // Lưu thêm vào metadata để tracking
            sourceUrl: sourceUrl
          },
          learningItems: {
            create: learningItemsData
          }
        },
        include: {
          learningItems: true
        }
      });

      // B. Khởi tạo tiến trình học (SRS) cho từng từ vựng
      // Set ngày ôn tập đầu tiên là NGAY BÂY GIỜ để người dùng thấy Flashcard lập tức
      const now = new Date();

      await Promise.all(newResource.learningItems.map(item =>
        tx.userProgress.create({
          data: {
            userId: userId,
            itemId: item.id,
            proficiency: 0,
            nextReviewDate: now
          }
        })
      ));

      // C. TỰ ĐỘNG TẠO TASK
      const newTask = await tx.task.create({
        data: {
          userId: userId,
          resourceId: newResource.id,
          title: `Ôn tập: ${title}`,
          description: `Review ${vocabList.length} từ vựng mới và tóm tắt.`,
          priority: "HIGH",
          dueDate: now,
          status: "TODO"
        }
      });

      // D. Update User Habit (Micro-learning)
      await habitService.logActivity(userId, 'ADD_VOCAB');

      return { resource: newResource, task: newTask };
    });

    console.log(`✅ [3/3] Xong! Resource ID: ${result.resource.id}, Task ID: ${result.task.id}`);
    return result;

  } catch (error) {
    console.error("❌ Lỗi quy trình createLearningResource:", error);
    throw error; // Ném lỗi ra để Controller bắt
  }
};

const getAllResources = async (userId) => {
  return await prisma.resource.findMany({
    where: { userId },
    include: {
      learningItems: true, // Lấy luôn từ vựng đi kèm
      tasks: true          // Lấy luôn task liên quan
    },
    orderBy: { createdAt: 'desc' } // Bài mới nhất lên đầu
  });
};

const getResourceById = async (id, userId) => {
  return await prisma.resource.findFirst({
    where: {
      id: id,
      userId: userId // Bảo mật: Chỉ lấy nếu thuộc về đúng User
    },
    include: {
      learningItems: {
        include: {
          progress: {
            where: { userId } // Chỉ lấy progress của chính user này
          }
        }
      },
      tasks: true
    }
  });
};

const getDueItems = async (userId) => {
  const today = new Date();
  return await prisma.userProgress.findMany({
    where: {
      userId,
      nextReviewDate: {
        lte: today // Lấy các từ đến hạn hoặc quá hạn
      },
      item: {
        type: 'VOCABULARY' // Chỉ lấy Vocabulary cho tính năng Flashcard cũ
      }
    },
    include: {
      item: {
        include: {
          resource: true
        }
      }
    }
  });
};

const getDueDictationSentences = async (userId) => {
  const today = new Date();
  return await prisma.userProgress.findMany({
    where: {
      userId,
      nextReviewDate: {
        lte: today
      },
      item: {
        type: 'SENTENCE' // Lọc riêng Sentence cho tính năng Dictation
      }
    },
    include: {
      item: {
        include: {
          resource: true
        }
      }
    }
  });
};

const updateReviewProgress = async (userId, progressId, result) => {
  const progress = await prisma.userProgress.findUnique({
    where: { id: progressId }
  });

  if (!progress || progress.userId !== userId) {
    throw new Error("Không tìm thấy tiến trình học");
  }

  let newProficiency = progress.proficiency;
  if (result === 'remembered') {
    newProficiency = Math.min(newProficiency + 1, 5);
  } else {
    newProficiency = Math.max(newProficiency - 1, 0);
  }

  // Thuật toán SRS đơn giản
  const intervals = [1, 2, 4, 7, 14, 30]; // số ngày
  const nextInterval = intervals[newProficiency];

  const now = new Date();
  const newNextReviewDate = new Date(now);
  newNextReviewDate.setDate(newNextReviewDate.getDate() + nextInterval);

  const reviewHistory = {
    logs: [
      ...(progress.reviewHistory?.logs || []),
      { date: now, result }
    ]
  };

  const updatedProgress = await prisma.userProgress.update({
    where: { id: progressId },
    data: {
      proficiency: newProficiency,
      nextReviewDate: newNextReviewDate,
      lastReviewedAt: now,
      reviewHistory: reviewHistory
    }
  });

  // Ghi nhận thói quen học tập (Làm bài ôn tập)
  await habitService.logActivity(userId, 'STUDY_SESSION');

  return updatedProgress;
};

const evaluateWritingPractice = async (userId, text, targetWords, modelId = null) => {
  console.log(`📝 Bắt đầu chấm bài viết cho User ${userId}...`);
  try {
    const result = await evaluateWritingWithGemini(text, targetWords, modelId);
    return result;
  } catch (error) {
    console.error("❌ Lỗi khi chấm bài viết:", error);
    throw error;
  }
};

const submitDictationAttempt = async (userId, learningItemId, progressId, userInput, originalText, isCorrect) => {
  // 1. Lưu lại lịch sử gõ
  const attempt = await prisma.dictationAttempt.create({
    data: {
      userId,
      learningItemId,
      originalText,
      userInput,
      accuracyScore: isCorrect ? 1.0 : 0.0 // Có thể lưu score tỷ lệ % sau này, backend quyết định
    }
  });

  // 2. Cập nhật tiến trình học SRS
  // nếu đúng -> remembered (tăng khoảng cách ôn tập)
  // nếu sai  -> forgot (gõ lại càng sớm càng tốt)
  const updatedProgress = await updateReviewProgress(userId, progressId, isCorrect ? 'remembered' : 'forgot');

  // Ghi nhận habit (Optional)
  await habitService.logActivity(userId, 'DICTATION_PRACTICE');

  return { updatedProgress, attempt };
};

module.exports = {
  createLearningResource,
  getAllResources,
  getResourceById,
  getDueItems,
  getDueDictationSentences,
  updateReviewProgress,
  submitDictationAttempt,
  evaluateWritingPractice
};