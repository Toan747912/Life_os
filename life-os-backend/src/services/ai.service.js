const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const axios = require('axios');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

class AIService {
  constructor() {
    this.generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    };
    // Default model
    this.defaultModelId = "gemini-2.0-flash";
    this.fallbackModels = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-pro-latest"];
    this.modelHealth = {}; // Stores { modelId: { status: 'ok'|'error', reason: string, lastTried: Date } }
  }

  async listModels() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

      // List of keywords to exclude (specialized models that don't support text-only output)
      const excludedKeywords = [
        'tts', 'audio', 'image', 'embedding', 'aqa',
        'imagen', 'veo', 'computer-use', 'deep-research',
        'bidi', 'nano-banana'
      ];

      // Map custom functional descriptions for better UX
      const modelDescriptions = {
        'gemini-2.5-flash': 'Model Flash mới nhất, cân bằng tuyệt vời giữa tốc độ và độ thông minh.',
        'gemini-2.5-pro': 'Mạnh mẽ nhất cho các tác vụ suy luận phức tạp và tóm tắt bài giảng dài.',
        'gemini-2.0-flash': 'Cực nhanh và đa năng, phù hợp cho hầu hết các tác vụ hàng ngày.',
        'gemini-2.0-flash-lite': 'Phiên bản siêu nhẹ, tốc độ cao và cực kỳ ổn định.',
        'gemini-1.5-flash': 'Model Flash đời cũ, ổn định cho các tác vụ cơ bản.',
        'gemini-1.5-pro': 'Hỗ trợ ngữ cảnh cực lớn (vũ trụ 2 triệu tokens).',
        'gemini-pro-latest': 'Luôn trỏ đến phiên bản Pro mạnh nhất hiện tại.',
        'gemini-flash-latest': 'Luôn trỏ đến phiên bản Flash nhanh nhất hiện tại.'
      };

      // Filter models that support generateContent AND are not specialized
      return response.data.models
        .filter(m => {
          const name = m.name.toLowerCase();
          const supportsGenerate = m.supportedGenerationMethods.includes('generateContent');
          const isSpecialized = excludedKeywords.some(keyword => name.includes(keyword));
          return supportsGenerate && !isSpecialized;
        })
        .map(m => {
          const id = m.name.split('/').pop();
          return {
            id: id,
            displayName: m.displayName,
            description: modelDescriptions[id] || m.description,
            inputTokenLimit: m.inputTokenLimit,
            outputTokenLimit: m.outputTokenLimit,
            health: this.modelHealth[id] || { status: 'ok', reason: null }
          };
        });
    } catch (error) {
      console.error("❌ Error listing models:", error.message);
      return [
        { id: "gemini-2.0-flash", displayName: "Gemini 2.0 Flash (Fallback)", description: "Fast and versatile" },
        { id: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash (Fallback)", description: "Mid-size multimodal model" }
      ];
    }
  }

  async analyzeText(text, modelId = null) {
    // Basic validation for modelId
    const excludedKeywords = ['tts', 'audio', 'image', 'embedding', 'bidi'];
    if (modelId && excludedKeywords.some(kw => modelId.toLowerCase().includes(kw))) {
      console.warn(`⚠️ Warning: Model ${modelId} appears to be specialized for non-text tasks. Falling back to default.`);
      modelId = null;
    }

    const modelsToTry = modelId
      ? [modelId, ...this.fallbackModels.filter(m => m !== modelId)]
      : this.fallbackModels;

    let lastError = null;

    for (const selectedModelId of modelsToTry) {
      try {
        let modelName = selectedModelId;
        if (modelName.startsWith('models/')) {
          modelName = modelName.replace('models/', '');
        }

        console.log(`🤖 Attempting analysis with model: ${modelName}`);

        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: this.generationConfig
        });

        const prompt = `
          Bạn là chuyên gia ngôn ngữ. Hãy phân tích văn bản: "${text}"
          
          LƯU Ý QUAN TRỌNG: Nếu văn bản đầu vào có chứa các mốc thời gian dạng [15s], [120s] v.v... ở đầu mỗi câu (thường là transcript từ video), bạn PHẢI trích xuất và trả về con số thời gian đó vào trường "timestamp" cho mỗi từ vựng mà bạn tìm được trong câu tương ứng. Nếu không có mốc thời gian, hãy để null.
          
          ĐỐI VỚI DICTATION: Bạn phải trích xuất toàn bộ các câu thoại hoặc ít nhất là các câu quan trọng thành một danh sách "sentences". Mỗi câu cần có phần tiếng Anh nguyên bản, phần dịch nghĩa tiếng Việt và mốc thời gian bắt đầu.

          Yêu cầu output (JSON schema):
          {
            "summary": "string (tóm tắt ngắn gọn)",
            "keywords": ["string", "string"],
            "difficulty": "string (Dễ/Trung bình/Khó)",
            "vocabularyList": [
              { 
                "word": "string (từ gốc)", 
                "ipa": "string (phiên âm quốc tế)",
                "definition": "string (nghĩa tiếng Việt)",
                "example": "string (câu ví dụ tiếng Anh)",
                "synonyms": ["string"],
                "timestamp": "number hoặc null (số giây xuất hiện trong video gốc nếu có)"
              }
            ],
            "sentences": [
              {
                "text": "string (câu thoại tiếng Anh nguyên bản)",
                "translation": "string (nghĩa tiếng Việt của câu)",
                "timestamp": number (số giây bắt đầu câu thoại)
              }
            ]
          }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();
        const jsonData = JSON.parse(textResponse);

        // Record success
        this.modelHealth[modelName] = { status: 'ok', reason: null, lastTried: new Date() };

        return jsonData;

      } catch (error) {
        lastError = error;
        console.error(`⚠️ AI Service Error (Model: ${selectedModelId}):`, error.message);

        let reason = "Error";
        if (error.message.includes('429') || error.message.includes('quota')) {
          reason = "Quota Exceeded (429)";
          console.warn(`🔄 Quota exceeded for ${selectedModelId}. Trying next fallback model...`);
        } else if (error.message.includes('404')) {
          reason = "Model Not Found (404)";
        } else {
          reason = error.message.substring(0, 50);
        }

        // Record failure
        this.modelHealth[selectedModelId.replace('models/', '')] = {
          status: 'error',
          reason: reason,
          lastTried: new Date()
        };

        if (reason.includes('Quota')) {
          continue; // Chuyển sang model tiếp theo
        }

        // Nếu không phải lỗi quota thì break luôn (hoặc có thể thử tiếp tùy logic)
        break;
      }
    }

    // Nếu tất cả các model đều thất bại
    return {
      summary: "Không thể phân tích lúc này (Lỗi AI/Quota)",
      keywords: [],
      difficulty: "N/A",
      vocabularyList: []
    };
  }

  async analyzeMedia(filePath, modelId = null) {
    // Media only works well directly with 1.5 Pro, 1.5 Flash, or 2.0 Flash
    const modelsToTry = modelId
      ? [modelId, ...this.fallbackModels.filter(m => m !== modelId)]
      : this.fallbackModels;

    let uploadResult = null;
    try {
      // 1. Upload file using GoogleAIFileManager
      console.log(`📡 Đang tải file lên Gemini API: ${filePath}`);
      const mime = require('mime-types').lookup(filePath) || 'audio/mp3';

      uploadResult = await fileManager.uploadFile(filePath, {
        mimeType: mime,
        displayName: filePath.split(/[\\/]/).pop(),
      });
      console.log(`✅ Tải file thành công. URI: ${uploadResult.file.uri}`);

      // Chờ file chuyển sang trạng thái ACTIVE (đối với video/audio)
      let fileInfo = await fileManager.getFile(uploadResult.file.name);
      while (fileInfo.state === "PROCESSING") {
        console.log(`⏳ Đang chờ Gemini xử lý file (trạng thái: PROCESSING)...`);
        await new Promise(resolve => setTimeout(resolve, 4000));
        fileInfo = await fileManager.getFile(uploadResult.file.name);
      }

      if (fileInfo.state === "FAILED") {
        throw new Error("Quá trình xử lý file của Gemini thất bại.");
      }

      console.log(`✅ File đã sẵn sàng phân tích (trạng thái: ${fileInfo.state}).`);



    } catch (uploadError) {
      console.error(`❌ Lỗi tải file lên Gemini API:`, uploadError);
      return {
        summary: "Lỗi tải file lên hệ thống phân tích",
        keywords: [],
        difficulty: "N/A",
        vocabularyList: []
      };
    }

    for (const selectedModelId of modelsToTry) {
      try {
        let modelName = selectedModelId;
        if (modelName.startsWith('models/')) {
          modelName = modelName.replace('models/', '');
        }

        console.log(`🎬 Attempting MEDIA analysis with model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: this.generationConfig
        });

        const prompt = `
          Bạn là chuyên gia ngôn ngữ. Tôi gửi cho bạn một file âm thanh/video.
          Hãy nghe/xem và phân tích nội dung của nó.
          
          LƯU Ý QUAN TRỌNG VỀ TIMESTAMP: Vì đây là file media, hãy theo dõi vị trí của các từ khóa và các câu thoại. Bạn PHẢI trích xuất và trả về con số thời gian xuất hiện (tính bằng giây) vào trường "timestamp".
          
          ĐỐI VỚI DICTATION: Bạn phải trích xuất toàn bộ các câu thoại hoặc ít nhất là các câu quan trọng thành một danh sách "sentences". Mỗi câu cần có phần tiếng Anh nguyên bản, phần dịch nghĩa tiếng Việt và mốc thời gian bắt đầu.

          Yêu cầu output (JSON schema):
          {
            "summary": "string (tóm tắt nội dung file media)",
            "keywords": ["string", "string"],
            "difficulty": "string (Dễ/Trung bình/Khó)",
            "vocabularyList": [
              { 
                "word": "string (từ gốc nghe được)", 
                "ipa": "string (phiên âm quốc tế)",
                "definition": "string (nghĩa tiếng Việt)",
                "example": "string (câu ví dụ tiếng Anh có chứa từ này trong bài)",
                "synonyms": ["string"],
                "timestamp": number (số giây xuất hiện trong file media)
              }
            ],
            "sentences": [
              {
                "text": "string (câu thoại tiếng Anh nguyên bản)",
                "translation": "string (nghĩa tiếng Việt của câu)",
                "timestamp": number (số giây bắt đầu câu thoại)
              }
            ]
          }
        `;

        const result = await model.generateContent([
          {
            fileData: {
              mimeType: uploadResult.file.mimeType,
              fileUri: uploadResult.file.uri
            }
          },
          { text: prompt }
        ]);

        const response = await result.response;
        const textResponse = response.text();
        const jsonData = JSON.parse(textResponse);

        this.modelHealth[modelName] = { status: 'ok', reason: null, lastTried: new Date() };

        // Xóa tạm (thật ra API server cũng tự xóa file sau 48h)
        try {
          await fileManager.deleteFile(uploadResult.file.name);
          console.log(`🗑️ Đã xóa file trên server Gemini: ${uploadResult.file.name}`);
        } catch (e) { /* ignore */ }

        return jsonData;

      } catch (error) {
        console.error(`⚠️ AI Service Error (MEDIA Model: ${selectedModelId}):`, error.message);

        if (error.message.includes('Quota')) {
          continue; // Chuyển sang model tiếp theo
        }
        break;
      }
    }

    // Clean up uploaded file on failure
    if (uploadResult && uploadResult.file) {
      try { await fileManager.deleteFile(uploadResult.file.name); } catch (e) { }
    }

    return {
      summary: "Không thể phân tích dữ liệu âm thanh/video lúc này",
      keywords: [],
      difficulty: "N/A",
      vocabularyList: []
    };
  }

  async evaluateWriting(text, targetWords = [], modelId = null) {
    const modelsToTry = modelId
      ? [modelId, ...this.fallbackModels.filter(m => m !== modelId)]
      : this.fallbackModels;

    for (const selectedModelId of modelsToTry) {
      try {
        let modelName = selectedModelId;
        if (modelName.startsWith('models/')) {
          modelName = modelName.replace('models/', '');
        }

        console.log(`📝 Attempting writing evaluation with model: ${modelName}`);

        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: this.generationConfig
        });

        const prompt = `
                Bạn là một giám khảo chấm thi tiếng Anh chuẩn quốc tế (IELTS/TOEFL) rất khắt khe nhưng cũng rất tận tâm.
                Học viên vừa gửi một đoạn văn bản tiếng Anh để bạn chấm điểm và nhận xét.
                
                Đoạn văn của học viên:
                "${text}"
                
                Danh sách từ vựng mục tiêu học viên cần sử dụng (có thể trống):
                [${targetWords.join(', ')}]
                
                Nhiệm vụ của bạn:
                1. Đánh giá điểm tổng quan trên thang điểm 100.
                2. Tìm và chỉ ra các lỗi ngữ pháp (nếu có).
                3. Nhận xét về cách học viên sử dụng các "từ vựng mục tiêu" (đúng ngữ cảnh chưa, tự nhiên chưa).
                4. Cung cấp 2 phiên bản "Native Speaker Version" giữ nguyên ý của học viên: một bản Formal (trang trọng, dùng cho công việc/học thuật) và một bản Casual/Idiomatic (giao tiếp tự nhiên hàng ngày).

                Yêu cầu output (JSON schema tĩnh, không trả về markdown hay ký tự thừa nào ngoài JSON):
                {
                  "score": number, // Từ 0 đến 100
                  "grammarFeedback": [
                    {
                      "error": "string (Trích dẫn đoạn sai)",
                      "correction": "string (Cách sửa đúng)",
                      "explanation": "string (Giải thích ngắn gọn bằng tiếng Việt)"
                    }
                  ],
                  "vocabularyUsage": "string (Nhận xét chung về cách dùng từ vựng mục tiêu và từ vựng nói chung bằng tiếng Việt. Chú ý nhắc đến những từ mục tiêu học viên dùng tốt hoặc dùng sai)",
                  "suggestedRevisionFormal": "string (Đoạn văn viết lại theo phong cách Trang trọng / Formal)",
                  "suggestedRevisionCasual": "string (Đoạn văn viết lại theo phong cách Giao tiếp / Casual / Idiomatic)"
                }
            `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();
        const jsonData = JSON.parse(textResponse);

        this.modelHealth[modelName] = { status: 'ok', reason: null, lastTried: new Date() };

        return jsonData;

      } catch (error) {
        console.error(`⚠️ AI Service Error (evaluating writing, Model: ${selectedModelId}):`, error.message);
        // Handle error logic similarly to analyzeText
        if (error.message.includes('Quota')) {
          continue;
        }
        break;
      }
    }

    // Default error response
    return {
      score: 0,
      grammarFeedback: [],
      vocabularyUsage: "Hệ thống AI đang quá tải hoặc gặp lỗi. Vui lòng thử lại sau.",
      suggestedRevisionFormal: text,
      suggestedRevisionCasual: text
    };
  }

  async generateRoleplayResponse(messages, context, modelId = null) {
    const prompt = `You are playing a role in a conversation to help an English learner practice. 
Your role/context is: ${context || 'A friendly native English speaker having a casual chat'}.

Here is the conversation history:
${messages.map(m => `${m.role === 'user' ? 'Learner' : 'You'}: ${m.content}`).join('\n')}

Instructions for your response:
1. Act exclusively as your assigned role. Do NOT break character.
2. Respond naturally and conversationally, as a human would in real life.
3. Keep your response relatively short (1-3 sentences) to encourage back-and-forth dialogue.
4. Do NOT provide translation, grammar explanations, or feedback unless explicitly asked.
5. If the learner makes a small grammar mistake, ignore it and just keep the conversation flowing naturally.
6. Simply output your next response directly. Do not include prefixes like "You:".`;

    // This method assumes a startChatAndSendMessage method exists or needs to be implemented.
    // For now, let's simulate it using generateContent directly for simplicity,
    // but a proper chat session management would be better.
    // If `startChatAndSendMessage` is a planned method, it should be added.
    // For this change, I'll assume a direct call to generateContent for the prompt.

    const modelsToTry = modelId
      ? [modelId, ...this.fallbackModels.filter(m => m !== modelId)]
      : this.fallbackModels;

    for (const selectedModelId of modelsToTry) {
      try {
        let modelName = selectedModelId;
        if (modelName.startsWith('models/')) {
          modelName = modelName.replace('models/', '');
        }

        console.log(`💬 Attempting roleplay response with model: ${modelName}`);

        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: this.generationConfig
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        this.modelHealth[modelName] = { status: 'ok', reason: null, lastTried: new Date() };
        return textResponse;

      } catch (error) {
        console.error(`⚠️ AI Service Error (generating roleplay response, Model: ${selectedModelId}):`, error.message);
        if (error.message.includes('Quota')) {
          continue;
        }
        break;
      }
    }
    return "I'm sorry, I'm having trouble responding right now. Please try again later.";
  }

  async evaluateDictation(originalText, userInput, accuracyScore, modelId = null) {
    const modelsToTry = modelId
      ? [modelId, ...this.fallbackModels.filter(m => m !== modelId)]
      : this.fallbackModels;

    for (const selectedModelId of modelsToTry) {
      try {
        let modelName = selectedModelId;
        if (modelName.startsWith('models/')) {
          modelName = modelName.replace('models/', '');
        }

        console.log(`🎧 Attempting dictation evaluation with model: ${modelName}`);

        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: this.generationConfig
        });

        const prompt = `
          Bạn là giáo viên tiếng Anh chấm bài nghe chép chính tả (dictation).
          Người học vừa nghe câu gốc: "${originalText}"
          Họ đã gõ lại: "${userInput}"
          Tỷ lệ đúng là ${accuracyScore}%.
          
          Nhiệm vụ của bạn:
          Hãy nhận xét ngắn gọn (dưới 50 chữ bằng tiếng Việt) về lỗi sai chính tả hoặc ngữ pháp họ mắc phải và cách khắc phục.
          Nếu họ gõ đúng tuyệt đối (100%), hãy dành một lời khen ngắn gọn.
          
          Yêu cầu output (JSON schema tĩnh, không trả lời markdown hay ký tự thừa nào ngoài JSON):
          {
            "feedback": "string (nhận xét ngắn gọn)"
          }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();
        const jsonData = JSON.parse(textResponse);

        this.modelHealth[modelName] = { status: 'ok', reason: null, lastTried: new Date() };

        return jsonData.feedback || jsonData.Feedback;

      } catch (error) {
        console.error(`⚠️ AI Service Error (evaluating dictation, Model: ${selectedModelId}):`, error.message);
        if (error.message.includes('Quota')) {
          continue;
        }
        break;
      }
    }

    return "Hệ thống AI đang gặp lỗi hoặc quá tải. Hãy thử tự so sánh câu của bạn với đáp án nhé!";
  }
}

const aiService = new AIService();

const analyzeTextWithGemini = async (text, modelId) => {
  return await aiService.analyzeText(text, modelId);
};

const analyzeMediaWithGemini = async (filePath, modelId) => {
  return await aiService.analyzeMedia(filePath, modelId);
};

const evaluateWritingWithGemini = async (text, targetWords, modelId) => {
  return await aiService.evaluateWriting(text, targetWords, modelId);
};

const evaluateDictationWithGemini = async (originalText, userInput, accuracyScore, modelId) => {
  return await aiService.evaluateDictation(originalText, userInput, accuracyScore, modelId);
};

const getAvailableModels = async () => {
  return await aiService.listModels();
};

module.exports = { analyzeTextWithGemini, analyzeMediaWithGemini, evaluateWritingWithGemini, getAvailableModels, evaluateDictationWithGemini };