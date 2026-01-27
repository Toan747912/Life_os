const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require('groq-sdk');
require('dotenv').config();

// --- CONFIGURATION ---
let groqClient;
let genAI;
let embeddingModel;
let visionModel;

// Initialize Groq
if (process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log("✅ [aiService] Groq AI Initialized (Text Gen).");
} else {
    console.warn("⚠️ [aiService] GROQ_API_KEY not found.");
}

// Initialize Gemini (required for Embeddings, fallback for Text)
if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
    visionModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    console.log("✅ [aiService] Gemini AI Initialized (Embeddings + Fallback Text/Vision).");
} else {
    console.warn("⚠️ [aiService] GEMINI_API_KEY not found. Embeddings will FAIL.");
}

// --- CORE FUNCTIONS ---

/**
 * Generate Vector Embedding for text
 * Uses Gemini 'embedding-001'
 * @param {string} text 
 * @returns {Promise<number[]>} Array of floating point numbers (768 dimensions for Gemini)
 */
async function generateEmbedding(text) {
    if (!embeddingModel) throw new Error("Gemini API not configured for embeddings");
    try {
        const result = await embeddingModel.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error("❌ [generateEmbedding] Error:", error.message);
        throw error;
    }
}

/**
 * Generate Text Completion
 * Priority: Groq -> Gemini
 * @param {string} prompt 
 * @param {boolean} jsonMode - If true, tries to enforce JSON output
 * @returns {Promise<string>}
 */
async function generateText(prompt, jsonMode = false) {
    // 1. Try Groq
    if (groqClient) {
        try {
            const completion = await groqClient.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama-3.3-70b-versatile",
                temperature: 0.7,
                response_format: jsonMode ? { type: "json_object" } : undefined
            });
            return completion.choices[0]?.message?.content || "";
        } catch (err) {
            console.warn("⚠️ [aiService] Groq failed, falling back to Gemini:", err.message);
        }
    }

    // 2. Fallback to Gemini
    if (genAI) {
        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-flash-latest",
                generationConfig: { responseMimeType: jsonMode ? "application/json" : "text/plain" }
            });
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (err) {
            console.error("❌ [aiService] Gemini failed:", err.message);
            throw err;
        }
    }

    throw new Error("No AI providers available");
}

/**
 * Socratic Tutor Review
 * @param {string} content 
 * @returns {Promise<string>} Markdown response
 */
async function reviewPostSocratic(postContent, resourceContext = "") {
    const systemPrompt = `
      Bạn là một Giáo sư Socratic nghiêm khắc nhưng mang tính xây dựng. 
      Người dùng đang cố gắng học một khái niệm mới bằng phương pháp Feynman (viết lại để hiểu).
      
      Nhiệm vụ của bạn:
      1. KHÔNG được viết lại bài giúp họ.
      2. Chỉ ra các lỗ hổng logic, các khái niệm mơ hồ.
      3. Đặt 2-3 câu hỏi gợi mở (probing questions) buộc họ phải suy nghĩ sâu hơn.
      4. Nếu họ dùng từ ngữ chuyên ngành sáo rỗng, hãy yêu cầu họ giải thích bằng ngôn ngữ đơn giản.
      
      Ngôn ngữ trả lời: Tiếng Việt.
    `;

    const userPrompt = `
      Tài liệu gốc (nếu có): ${resourceContext}
      ---
      Bài viết của tôi: ${postContent}
    `;

    // Use generateText helper which handles Groq/Gemini fallback
    return await generateText(systemPrompt + "\n\n" + userPrompt);
}

module.exports = {
    generateEmbedding,
    generateText,
    reviewPostSocratic
};
