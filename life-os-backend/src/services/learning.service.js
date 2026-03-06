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

      // -- TÍCH HỢP SUPABASE --
      try {
        if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
          const { uploadFileToSupabase } = require('../utils/supabaseStorage');
          const path = require('path');
          const mime = require('mime-types').lookup(textContent) || 'application/octet-stream';
          console.log(`☁️ Đang upload file Media lên Supabase...`);
          const publicUrl = await uploadFileToSupabase(textContent, path.basename(textContent), mime);
          console.log(`✅ Upload Supabase thành công: ${publicUrl}`);

          // Xóa file local sau khi upload xong
          const fs = require('fs');
          if (fs.existsSync(textContent)) {
            fs.unlinkSync(textContent);
          }
          // Ghi đè biến để dùng URL public cho đường dẫn lưu vào DB
          textContent = publicUrl;
        }
      } catch (uploadError) {
        console.error('Lỗi khi upload lên Supabase, giữ lại file local:', uploadError);
      }
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
      const isCloudUrl = textContent && textContent.startsWith('http');
      const relativeFilePath = type === 'MEDIA' ? (isCloudUrl ? textContent : `uploads/${path.basename(textContent)}`) : null;

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

const quickAddVocabulary = async (userId, keyword, modelId = null) => {
  try {
    const { generateFlashcardDataWithGemini } = require('./ai.service');
    console.log(`✨ [1/3] Gửi keyword "${keyword}" cho AI tạo Flashcard...`);

    // Gọi Gemini AI với System Prompt đặc biệt cho Magic Dictionary
    const flashcardData = await generateFlashcardDataWithGemini(keyword, modelId);

    console.log(`💾 [2/3] Lưu Flashcard từ khóa "${flashcardData.word}" vào database...`);

    // Lưu vào Database với Prisma (tương tự LearningItem)
    const result = await prisma.$transaction(async (tx) => {
      const newLearningItem = await tx.learningItem.create({
        data: {
          userId: userId, // Liên kết item với user
          term: flashcardData.word || keyword,
          type: "VOCABULARY",
          definition: flashcardData.meaning || "",
          exampleSentence: flashcardData.exampleSentence || "",
          extraInfo: {
            phonetic: flashcardData.phonetic || "",
            hanViet: flashcardData.hanViet || null,
            partOfSpeech: flashcardData.partOfSpeech || "",
            exampleTranslation: flashcardData.exampleTranslation || "",
            contextualNuance: flashcardData.contextualNuance || "",
            synonyms: flashcardData.synonyms || [],
            antonyms: flashcardData.antonyms || [],
            collocations: flashcardData.collocations || [],
            wordFamily: flashcardData.wordFamily || []
          }
        }
      });

      const now = new Date();
      // Khởi tạo tiến trình học ngay lập tức để học viên có thể học ngay
      const progress = await tx.userProgress.create({
        data: {
          userId: userId,
          itemId: newLearningItem.id,
          proficiency: 0,
          nextReviewDate: now
        }
      });

      // Update User Habit cho hành động Quick Add
      await habitService.logActivity(userId, 'QUICK_ADD_VOCAB');

      return { learningItem: newLearningItem, progress };
    });

    console.log(`✅ [3/3] Xong Quick Add cho keyword: ${keyword}`);
    // Trả về LearningItem đã được gắn định dạng Flashcard
    return result.learningItem;
  } catch (error) {
    console.error("❌ Lỗi quy trình quickAddVocabulary:", error);
    throw error;
  }
};

const lookupVocabulary = async (keyword, modelId = null) => {
  try {
    const { generateFlashcardDataWithGemini } = require('./ai.service');
    console.log(`✨ [Lookup] Tra cứu keyword: "${keyword}"...`);
    const flashcardData = await generateFlashcardDataWithGemini(keyword, modelId);
    return flashcardData; // Không lưu vào DB, trả về ngay kết quả JSON
  } catch (error) {
    console.error("❌ Lỗi quy trình lookupVocabulary:", error);
    throw error;
  }
};

module.exports = {
  createLearningResource,
  getAllResources,
  getResourceById,
  getDueItems,
  getDueDictationSentences,
  updateReviewProgress,
  submitDictationAttempt,
  evaluateWritingPractice,
  quickAddVocabulary,
  lookupVocabulary
};