const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class AIService {
  constructor() {
    // Cấu hình generationConfig để ép kiểu JSON
    this.generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
      responseMimeType: "application/json", // <--- ĐÂY LÀ CHÌA KHÓA
    };

    // Khởi tạo model với config
    this.model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: this.generationConfig
    });
  }

  async analyzeText(text) {
    try {
      // Prompt không cần dặn dò quá nhiều về format JSON nữa vì config đã lo
      const prompt = `
        Bạn là chuyên gia ngôn ngữ. Hãy phân tích văn bản: "${text}"
        
        Yêu cầu output (JSON schema):
        {
          "summary": "string (tóm tắt ngắn gọn)",
          "keywords": ["string", "string"],
          "difficulty": "string (Dễ/Trung bình/Khó)",
          "vocabularyList": [
            { "word": "string (từ gốc)", "definition": "string (nghĩa tiếng Việt)" }
          ]
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;

      // Vì đã ép kiểu JSON, ta có thể parse trực tiếp an toàn hơn
      const textResponse = response.text();
      const jsonData = JSON.parse(textResponse);

      return jsonData;

    } catch (error) {
      console.error("❌ AI Service Error:", error.message);
      // Fallback giữ nguyên như bạn làm là rất tốt
      return {
        summary: "Không thể phân tích lúc này (Lỗi AI)",
        keywords: [],
        difficulty: "N/A",
        vocabularyList: []
      };
    }
  }
}

const aiService = new AIService();

const analyzeTextWithGemini = async (text) => {
  return await aiService.analyzeText(text);
};

module.exports = { analyzeTextWithGemini };