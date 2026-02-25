const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const fs = require('fs');
const path = require('path');
const youtubedl = require('youtube-dl-exec');

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

// ============================================
// CÁCH 1: Upload File + AI Phân Tích Tự Động
// ============================================

exports.analyzeAudio = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Vui lòng upload file audio/video' });
        }

        const { difficulty, language, title } = req.body;
        const filePath = path.join(__dirname, '../..', 'uploads', req.file.filename);
        const fileUrl = `/uploads/${req.file.filename}`;
        const mimeType = req.file.mimetype;

        const userId = req.user.id;
        const userService = require('../services/user.service');
        const prefs = await userService.getPreferences(userId);
        const aiModel = prefs.defaultAiModel || 'gemini-1.5-flash';

        // Kiểm tra file tồn tại
        if (!fs.existsSync(filePath)) {
            return res.status(400).json({ error: 'File không tồn tại' });
        }

        // Upload lên Gemini File API và phân tích
        const result = await analyzeWithGemini(filePath, mimeType, aiModel);

        // Trả về kết quả để user xác nhận
        res.json({
            success: true,
            filePath: fileUrl,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            duration: result.duration,
            ...result.analysis
        });

    } catch (error) {
        console.error('Error analyzing audio:', error);
        res.status(500).json({ error: error.message });
    }
};

async function analyzeWithGemini(filePath, mimeType, aiModel = 'gemini-1.5-flash') {
    // Upload file to Gemini
    const uploadResult = await fileManager.uploadFile(filePath, {
        mimeType: mimeType,
        displayName: path.basename(filePath)
    });

    let fileInfo = await fileManager.getFile(uploadResult.file.name);
    while (fileInfo.state === "PROCESSING") {
        console.log(`⏳ Đang chờ Gemini xử lý file (trạng thái: PROCESSING)...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        fileInfo = await fileManager.getFile(uploadResult.file.name);
    }

    if (fileInfo.state === "FAILED") {
        throw new Error("Quá trình xử lý file của Gemini thất bại.");
    }

    const model = genAI.getGenerativeModel({ model: aiModel });

    // Lấy thời lượng video từ metadata
    let duration = 0;
    try {
        duration = await getMediaDuration(filePath);
    } catch (e) {
        console.log('Could not get duration:', e.message);
    }

    // Prompt phân tích chi tiết
    const prompt = `
    Phân tích file audio/video này và trả về JSON với cấu trúc chính xác như sau:

    {
      "transcript": "Toàn bộ nội dung nghe được, viết hoa đầu câu, có dấu câu đầy đủ",
      "sentences": [
        {"text": "Câu 1 hoàn chỉnh", "startTime": 0, "endTime": 3.5},
        {"text": "Câu 2 hoàn chỉnh", "startTime": 3.5, "endTime": 7.2}
      ],
      "summary": "Tóm tắt 2-3 câu về nội dung chính của đoạn audio",
      "vocabulary": ["từ1", "từ2", "từ3", "từ4", "từ5"], 
      "keyPhrases": ["cụm từ thông dụng 1", "cụm từ thông dụng 2"]
    }

    Yêu cầu:
    - Transcript phải chính xác, đầy đủ, có dấu câu
    - Mỗi câu trong sentences phải có nội dung đầy đủ
    - timestamps phải chính xác theo thứ tự xuất hiện trong audio
    - vocabulary chọn 5-10 từ mới, trung bình khó, hữu ích cho người học ngôn ngữ
    - Chỉ trả về JSON, không giải thích gì thêm
  `;

    const response = await model.generateContent([
        prompt,
        {
            fileData: {
                fileUri: uploadResult.file.uri,
                mimeType: uploadResult.file.mimeType
            }
        }
    ]);
    const text = response.response.text();

    // Parse JSON từ response
    let analysis;
    try {
        // Loại bỏ markdown formatting nếu có
        const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
        analysis = JSON.parse(cleanText);
    } catch (e) {
        // Nếu parse thất bại, thử regex để trích xuất
        analysis = parseJsonFallback(text);
    }

    return { duration, analysis };
}

function parseJsonFallback(text) {
    // Fallback nếu AI không trả về JSON chuẩn
    const transcriptMatch = text.match(/"transcript":\s*"([^"]+)"/);
    const summaryMatch = text.match(/"summary":\s*"([^"]+)"/);
    const vocabMatch = text.match(/"vocabulary":\s*\[([^\]]+)\]/);

    return {
        transcript: transcriptMatch ? transcriptMatch[1] : text,
        sentences: [],
        summary: summaryMatch ? summaryMatch[1] : '',
        vocabulary: vocabMatch ? vocabMatch[1].split(',').map(w => w.trim().replace(/"/g, '')) : []
    };
}

function getMediaDuration(filePath) {
    return new Promise((resolve, reject) => {
        const { ffprobe } = require('fluent-ffmpeg');
        ffprobe(filePath, (err, metadata) => {
            if (err) reject(err);
            else resolve(metadata.format.duration || 0);
        });
    });
}

// ============================================
// CÁCH 2: Từ YouTube URL
// ============================================

exports.analyzeYouTube = async (req, res) => {
    try {
        const { youtubeUrl, difficulty, language, title } = req.body;

        if (!youtubeUrl) {
            return res.status(400).json({ error: 'Vui lòng nhập URL YouTube' });
        }

        const userId = req.user.id;
        const userService = require('../services/user.service');
        const prefs = await userService.getPreferences(userId);
        const aiModel = prefs.defaultAiModel || 'gemini-1.5-flash';

        // Validate YouTube URL
        const videoId = extractYouTubeId(youtubeUrl);
        if (!videoId) {
            return res.status(400).json({ error: 'URL YouTube không hợp lệ' });
        }

        // Lấy thông tin video
        let videoInfo;
        try {
            videoInfo = await youtubedl(youtubeUrl, {
                dumpSingleJson: true,
                noWarnings: true,
                noCheckCertificate: true,
                preferFreeFormats: true,
                youtubeSkipDashManifest: true
            });
        } catch (infoError) {
            console.error('Lỗi khi lấy stream info từ youtube-dl-exec:\n', infoError);
            return res.status(400).json({ error: 'Không thể lấy thông tin video. Có thể video bị giới hạn, bản quyền, hoặc URL không hợp lệ.' });
        }

        const videoTitle = title || videoInfo.title;
        const duration = parseInt(videoInfo.duration || 0);

        // Download audio và lưu tạm
        const tempFilePath = path.join(__dirname, '../..', 'uploads', `youtube_${videoId}.m4a`);

        try {
            await youtubedl(youtubeUrl, {
                format: 'm4a/bestaudio/best',
                output: tempFilePath,
                noWarnings: true,
                noCheckCertificate: true
            });
        } catch (downloadError) {
            console.error('Lỗi khi tải audio từ video YouTube:\n', downloadError);
            return res.status(500).json({ error: 'Trích xuất âm thanh từ YouTube thất bại. Vui lòng thử lại sau.' });
        }

        // Phân tích với AI
        const result = await analyzeWithGemini(tempFilePath, 'audio/mp4', aiModel);

        // Xóa file tạm
        fs.existsSync(tempFilePath) && fs.unlinkSync(tempFilePath);

        // Trả về kết quả
        res.json({
            success: true,
            sourceType: 'youtube',
            sourceUrl: youtubeUrl,
            videoId: videoId,
            videoTitle: videoTitle,
            duration: duration,
            ...result.analysis
        });

    } catch (error) {
        console.error('Error analyzing YouTube:', error);
        res.status(500).json({ error: error.message });
    }
};

function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// ============================================
// CÁCH 3 & 4: Lưu Bài Học (Chung)
// ============================================

exports.saveDictation = async (req, res) => {
    try {
        const {
            title,
            audioUrl,
            transcript,
            sentences,
            vocabulary,
            summary,
            difficulty,
            language,
            sourceType,
            sourceUrl,
            duration
        } = req.body;

        const userId = req.user.id;

        // Validation
        if (!title || !audioUrl || !transcript) {
            return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
        }

        if (!sentences || sentences.length === 0) {
            return res.status(400).json({ error: 'Cần ít nhất 1 câu' });
        }

        const dictation = await prisma.dictation.create({
            data: {
                title,
                audioUrl,
                transcript,
                sentences: sentences, // changed to object since prisma mapped to JSON
                vocabulary: vocabulary || null, // changed to object
                summary: summary || null,
                difficulty: difficulty || 'medium',
                language: language || 'en',
                sourceType: sourceType || 'manual',
                sourceUrl: sourceUrl || null,
                duration: duration ? parseInt(duration) : null,
                userId
            }
        });

        res.status(201).json({
            success: true,
            dictation
        });

    } catch (error) {
        console.error('Lỗi khi lưu bài học (saveDictation):', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};

// ============================================
// CRUD Operations Cơ Bản
// ============================================

exports.getAllDictations = async (req, res) => {
    try {
        const { language, difficulty, search } = req.query;
        const userId = req.user.id;

        const where = { userId };
        if (language) where.language = language;
        if (difficulty) where.difficulty = difficulty;
        if (search) {
            where.title = { contains: search, mode: 'insensitive' };
        }

        const dictations = await prisma.dictation.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                audioUrl: true,
                difficulty: true,
                language: true,
                sourceType: true,
                duration: true,
                createdAt: true,
                _count: { select: { attempts: true } }
            }
        });

        res.json(dictations);
    } catch (error) {
        require('fs').writeFileSync('dictation-error.log', error.stack || error.message);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};

exports.getDictationById = async (req, res) => {
    try {
        const { id } = req.params;
        const dictation = await prisma.dictation.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, fullName: true } }
            }
        });

        if (!dictation) {
            return res.status(404).json({ error: 'Dictation not found' });
        }

        res.json(dictation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteDictation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Kiểm tra quyền sở hữu
        const dictation = await prisma.dictation.findFirst({
            where: { id, userId }
        });

        if (!dictation) {
            return res.status(404).json({ error: 'Không tìm thấy bài học' });
        }

        // Xóa file audio nếu là upload (không phải YouTube)
        if (dictation.sourceType === 'upload' && dictation.audioUrl) {
            const filePath = path.join(__dirname, '../..', dictation.audioUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Xóa bài học và các bản ghi liên quan
        await prisma.dictationAttempt.deleteMany({ where: { dictationId: id } });
        await prisma.dictation.delete({ where: { id } });

        res.json({ success: true, message: 'Xóa bài học thành công' });
    } catch (error) {
        console.error('Error deleting dictation:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateDictation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { title, difficulty, language, transcript, sentences, vocabulary, summary } = req.body;

        // Kiểm tra quyền sở hữu
        const dictation = await prisma.dictation.findFirst({
            where: { id, userId }
        });

        if (!dictation) {
            return res.status(404).json({ error: 'Không tìm thấy bài học' });
        }

        const updated = await prisma.dictation.update({
            where: { id },
            data: {
                title: title || dictation.title,
                difficulty: difficulty || dictation.difficulty,
                language: language || dictation.language,
                transcript: transcript || dictation.transcript,
                sentences: sentences ? sentences : dictation.sentences,
                vocabulary: vocabulary ? vocabulary : dictation.vocabulary,
                summary: summary || dictation.summary
            }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ============================================
// Luyện tập (Practice) - Đã có từ trước
// ============================================

exports.createDictation = async (req, res) => {
    return exports.saveDictation(req, res);
};

exports.submitDictation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { userInput, originalText, timeSpent, accuracyScore, levenshteinDist, errorDetails } = req.body;

        const attempt = await prisma.dictationAttempt.create({
            data: {
                dictationId: id,
                userId,
                userInput,
                originalText,
                timeSpent,
                accuracyScore: accuracyScore || 0,
                levenshteinDist: levenshteinDist || 0,
                errorDetails: errorDetails || []
            }
        });

        res.json({ success: true, attempt });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUserAttempts = async (req, res) => {
    try {
        const { dictationId } = req.params;
        const attempts = await prisma.dictationAttempt.findMany({
            where: { dictationId, userId: req.user.id }
        });
        res.json(attempts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};