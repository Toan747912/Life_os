const express = require('express');
require('dotenv').config();
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require('groq-sdk');

const app = express();
app.use(cors());
// Tăng giới hạn của body-parser để nhận ảnh base64
app.use(bodyParser.json({ limit: '10mb' }));

// --- CẤU HÌNH AI PROVIDERS ---
// Priority: Groq (free tier 14,400 req/day) → Gemini (free tier 20 req/day)
let groqClient;
let genAI;
let visionModel;

// Initialize Groq
if (process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log("✅ Groq AI Initialized Successfully (Primary Provider).");
} else {
    console.warn("⚠️  Warning: GROQ_API_KEY not found in .env file. Falling back to Gemini.");
}

// Initialize Gemini (as fallback)
if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    visionModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    console.log(groqClient ? "✅ Gemini AI Initialized (Fallback Provider)." : "✅ Gemini AI Initialized Successfully.");
} else {
    console.warn("⚠️  Warning: GEMINI_API_KEY not found in .env file. Gemini features will be disabled.");
}

if (!groqClient && !genAI) {
    console.error("❌ ERROR: No AI providers configured! Please add GROQ_API_KEY or GEMINI_API_KEY to .env");
}

// CẤU HÌNH KẾT NỐI DATABASE
const pool = new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false } // Bắt buộc cho Supabase/Render
        }
        : {
            user: 'postgres',
            host: 'localhost',
            database: 'life_os',
            password: 'ngoquoctoan1234',
            port: 5432,
        }
);

// --- DB MIGRATION CHECK ---
(async () => {
    try {
        const client = await pool.connect();
        await client.query('ALTER TABLE sentences ADD COLUMN IF NOT EXISTS context TEXT'); // For "Original Sentence"
        client.release();
        console.log("✅ DB Migration: 'context' column checked/added.");
    } catch (err) {
        console.error("⚠️ DB Migration Failed:", err);
    }
})();

// --- HELPER FUNCTIONS ---

// Tính số từ
function countWords(str) {
    return str.trim().split(/\s+/).length;
}

// Xử lý chuỗi theo Level
function processSentenceForLevel(content, level, allSentences) {
    let processed = content;
    // Level 2, 3, 4: Lowercase + Remove Punctuation
    if (level >= 2) {
        processed = processed.toLowerCase().replace(/[.,!?;:]/g, "");
    }

    let words = processed.split(/\s+/);

    // Distractors (Từ nhiễu)
    let distractors = [];
    if (level >= 3 && allSentences.length > 0) {
        const numDistractors = level === 3 ? 3 : 5;
        // Lấy tất cả các từ từ các câu KHÁC
        const allWordsPool = allSentences
            .filter(s => s.content !== content) // Tránh lấy từ của chính mình
            .map(s => s.content.toLowerCase().replace(/[.,!?;:]/g, "").split(/\s+/))
            .flat();

        // Random pick
        for (let i = 0; i < numDistractors; i++) {
            if (allWordsPool.length > 0) {
                const randIdx = Math.floor(Math.random() * allWordsPool.length);
                distractors.push(allWordsPool[randIdx]);
            }
        }
    }

    // Combine & Shuffle
    const finalWords = [...words, ...distractors].sort(() => Math.random() - 0.5);

    return {
        shuffled_words: finalWords,
        word_count: words.length // Số từ gốc (để tính giờ)
    };
}

// Tính thời gian cho mỗi câu
function calculateTimeLimit(wordCount, level) {
    const baseBuffer = 5; // 5s bù giờ
    if (level === 1) return (wordCount * 4) + baseBuffer;
    if (level === 2) return Math.ceil(wordCount * 2.5) + baseBuffer;
    if (level === 3) return Math.ceil(wordCount * 1.5) + baseBuffer;
    if (level === 4) return Math.ceil(wordCount * 1.0) + baseBuffer;
    return 60;
}

// --- APIS ---

// API 1: Lấy danh sách bài học
app.get('/api/lessons', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT l.*, 
                CASE WHEN EXISTS (SELECT 1 FROM sentences s WHERE s.lesson_id = l.id AND s.prompt IS NOT NULL) 
                        THEN 'TRANSFORMATION' 
                        ELSE 'STANDARD' 
                END as type
            FROM lessons l 
            ORDER BY l.id DESC
        `);
        console.log(`[GET /api/lessons] Found ${result.rows.length} lessons`);
        res.json(result.rows);
    } catch (err) {
        console.error("[GET /api/lessons] DATABASE ERROR:", err);
        res.status(500).json({
            error: "Database error while fetching lessons",
            details: err.message,
            code: err.code
        });
    }

});

// API 2: Lấy chi tiết các câu (Legacy view)
app.get('/api/lessons/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM sentences WHERE lesson_id = $1 ORDER BY "order" ASC', [id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

// API 3: Thêm bài học mới (Updated Logic)
app.post('/api/lessons', async (req, res) => {
    const { title, text } = req.body;

    const rawSentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const sentencesToProcess = rawSentences.length > 0 ? rawSentences : text.split(/\n+/).filter(s => s.trim().length > 0);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const lessonRes = await client.query('INSERT INTO lessons(title) VALUES($1) RETURNING id', [title]);
        const lessonId = lessonRes.rows[0].id;

        for (let i = 0; i < sentencesToProcess.length; i++) {
            const s = sentencesToProcess[i].trim();
            if (s.length > 0) {
                // --- LOGIC CHIA LEVEL & WORD COUNT ---
                const wordCount = countWords(s);
                let level = 'EASY';
                if (wordCount > 15) level = 'HARD';
                else if (wordCount > 8) level = 'MEDIUM';
                // --------------------------------

                await client.query(
                    'INSERT INTO sentences(lesson_id, content, "order", difficulty, word_count) VALUES($1, $2, $3, $4, $5)',
                    [lessonId, s, i, level, wordCount]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, lessonId });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("[POST /api/lessons] ERROR:", e);
        res.status(500).json(e);
    } finally {
        client.release();
    }

});

// API 3.5: Thêm bài học có cấu trúc (cho Sentence Transformation)
app.post('/api/structured-lesson', async (req, res) => {
    const { title, sentences } = req.body; // sentences: [{ content, prompt, distractors: [] }]

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const lessonRes = await client.query('INSERT INTO lessons(title) VALUES($1) RETURNING id', [title]);
        const lessonId = lessonRes.rows[0].id;

        for (let i = 0; i < sentences.length; i++) {
            const s = sentences[i];
            const content = s.content.trim();
            const prompt = s.prompt || null;
            const context = s.context || null; // NEW: Original Sentence
            const distractors = JSON.stringify(s.distractors || []);

            if (content.length > 0) {
                const wordCount = countWords(content);
                let level = 'EASY';
                if (wordCount > 15) level = 'HARD';
                else if (wordCount > 8) level = 'MEDIUM';

                await client.query(
                    'INSERT INTO sentences(lesson_id, content, "order", difficulty, word_count, prompt, distractors, context) VALUES($1, $2, $3, $4, $5, $6, $7, $8)',
                    [lessonId, content, i, level, wordCount, prompt, distractors, context]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, lessonId });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("[POST /api/structured-lesson] ERROR:", e);
        res.status(500).json(e);
    } finally {
        client.release();
    }
});

// API 3.6: Generate Distractors (Groq/Gemini)
app.post('/api/generate-distractors', async (req, res) => {
    if (!groqClient && !genAI) {
        return res.status(503).json({ error: "No AI providers available" });
    }

    const { sentence, prompt } = req.body;

    try {
        const aiPrompt = `
            Task: Generate 5-6 single-word distractors for a sentence scrambling game.
            Target Sentence: "${sentence}"
            ${prompt ? `Keyword: "${prompt}"` : ''}
            
            Rules:
            1. The distractors should be grammatically plausible but incorrect in the context of the target sentence.
            2. They should be related words (synonyms, antonyms, similar spelling, same semantic field).
            3. Do NOT include words that are already in the target sentence.
            4. Return ONLY a JSON array of strings.
            
            Example Output: ["bad", "mistake", "error", "problem", "fault"]
        `;

        let text;

        // Try Groq first
        if (groqClient) {
            try {
                console.log("[POST /api/generate-distractors] Using Groq AI...");
                const completion = await groqClient.chat.completions.create({
                    messages: [{ role: "user", content: aiPrompt }],
                    model: "llama-3.3-70b-versatile",
                    temperature: 0.7,
                    max_tokens: 200
                });
                text = completion.choices[0]?.message?.content || "";
                console.log("[POST /api/generate-distractors] Groq Response:", text);
            } catch (groqError) {
                console.warn("[POST /api/generate-distractors] Groq failed, falling back to Gemini:", groqError.message);
                if (genAI) {
                    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
                    const result = await model.generateContent(aiPrompt);
                    const response = await result.response;
                    text = response.text();
                    console.log("[POST /api/generate-distractors] Gemini Response:", text);
                } else {
                    throw groqError;
                }
            }
        } else if (genAI) {
            // Use Gemini if Groq not available
            console.log("[POST /api/generate-distractors] Using Gemini AI...");
            const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
            const result = await model.generateContent(aiPrompt);
            const response = await result.response;
            text = response.text();
            console.log("[POST /api/generate-distractors] Gemini Response:", text);
        }

        // Robust JSON extraction
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error("No JSON array found in response");
        }

        const distractors = JSON.parse(jsonMatch[0]);

        res.json({ distractors });
    } catch (error) {
        console.error("[POST /api/generate-distractors] ERROR:", error);
        res.status(500).json({
            error: "Failed to generate distractors",
            details: error.message,
            rawResponse: error.rawResponse
        });
    }
});

// API 4: Update bài học (PUT)
app.put('/api/lessons/:id', async (req, res) => {
    const { id } = req.params;
    const { title, text } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Update Title
        await client.query('UPDATE lessons SET title = $1 WHERE id = $2', [title, id]);

        // 2. If text is provided, regenerate sentences
        if (text) {
            // Delete old sentences
            await client.query('DELETE FROM sentences WHERE lesson_id = $1', [id]);

            // Process new text
            const rawSentences = text.match(/[^.!?]+[.!?]+/g) || [];
            const sentencesToProcess = rawSentences.length > 0 ? rawSentences : text.split(/\n+/).filter(s => s.trim().length > 0);

            for (let i = 0; i < sentencesToProcess.length; i++) {
                const s = sentencesToProcess[i].trim();
                if (s.length > 0) {
                    const wordCount = countWords(s);
                    let level = 'EASY';
                    if (wordCount > 15) level = 'HARD';
                    else if (wordCount > 8) level = 'MEDIUM';

                    await client.query(
                        'INSERT INTO sentences(lesson_id, content, "order", difficulty, word_count) VALUES($1, $2, $3, $4, $5)',
                        [id, s, i, level, wordCount]
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
        res.status(500).json(e);
    } finally {
        client.release();
    }
});

// API 5: Xóa bài học (DELETE)
app.delete('/api/lessons/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Delete sentences first (manual cascade)
        await client.query('DELETE FROM sentences WHERE lesson_id = $1', [id]);
        // Delete lesson
        await client.query('DELETE FROM lessons WHERE id = $1', [id]);
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
        res.status(500).json(e);
    } finally {
        client.release();
    }
});

// --- NEW GAME APIS ---

// INIT GAME SESSION
app.get('/api/study/init/:lessonId', async (req, res) => {
    try {
        const { lessonId } = req.params;
        const level = parseInt(req.query.level) || 1;

        // 1. Get raw sentences
        const sentencesRes = await pool.query('SELECT * FROM sentences WHERE lesson_id = $1 ORDER BY "order" ASC', [lessonId]);
        const sentences = sentencesRes.rows;

        // 2. Process for Game
        const gameData = sentences.map(s => {
            let finalWords;
            let distractors = [];

            // Check if we have explicit distractors (Transformation Mode)
            if (s.distractors && Array.isArray(s.distractors) && s.distractors.length > 0) {
                distractors = s.distractors; // Use provided distractors
                // For Transformation Mode, we shuffle content + distractors
                const contentWords = s.content.split(/\s+/); // Plain split for now
                finalWords = [...contentWords, ...distractors].sort(() => Math.random() - 0.5);
            } else {
                // Classic Auto-Generated Mode
                const processed = processSentenceForLevel(s.content, level, sentences);
                finalWords = processed.shuffled_words;
            }

            return {
                id: s.id,
                shuffled_words: finalWords, // Anti-cheat: Only return shuffled words
                time_limit: calculateTimeLimit(s.word_count || countWords(s.content), level),
                time_limit: calculateTimeLimit(s.word_count || countWords(s.content), level),
                difficulty: s.difficulty, // For reference
                prompt: s.prompt, // Include prompt if exists
                context: s.context // NEW: Include context if exists
            };
        });

        res.json({
            level,
            sentences: gameData
        });

    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

// GET REVIEW SESSION (WRONG ANSWERS ONLY)
app.get('/api/study/review/:lessonId', async (req, res) => {
    try {
        const { lessonId } = req.params;
        const level = parseInt(req.query.level) || 1;

        // 1. Get Sentences that are marked WRONG in user_progress
        const query = `
            SELECT s.* 
            FROM sentences s
            JOIN user_progress up ON s.id = up.sentence_id
            WHERE s.lesson_id = $1 
            AND up.status = 'WRONG'
            ORDER BY s."order" ASC
        `;
        const result = await pool.query(query, [lessonId]);
        const sentences = result.rows;

        // 2. Process for Game (Reuse logic)
        const gameData = sentences.map(s => {
            const { shuffled_words, word_count } = processSentenceForLevel(s.content, level, sentences);
            return {
                id: s.id,
                shuffled_words,
                time_limit: calculateTimeLimit(word_count, level),
                difficulty: s.difficulty
            };
        });

        res.json({
            level,
            sentences: gameData
        });

    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

// SUBMIT ANSWER
app.post('/api/study/submit', async (req, res) => {
    try {
        const { sentenceId, finalArrangement, level } = req.body; // finalArrangement is array of words

        // 1. Get Original Sentence
        const sRes = await pool.query('SELECT content FROM sentences WHERE id = $1', [sentenceId]);
        if (sRes.rows.length === 0) return res.status(404).json({ error: "Sentence not found" });

        const originalContent = sRes.rows[0].content;

        // 2. Validate
        let isCorrect = false;
        const userAnswer = finalArrangement.join(" ").trim();

        if (level === 1) {
            // Level 1: Exact match (case sensitive, punctuation included) - user rearranges chunks that might contain punctuation
            isCorrect = userAnswer === originalContent;
            // Fallback: If level 1 splits by space, punctuation sticks to words. Reordering should match exactly.
        } else {
            // Level 2, 3, 4: Compare lowercase, no punctuation
            const cleanOriginal = originalContent.toLowerCase().replace(/[.,!?;:]/g, "").trim();
            const cleanUser = userAnswer.toLowerCase().replace(/[.,!?;:]/g, "").trim();
            isCorrect = cleanOriginal === cleanUser;
        }

        // 3. Update Progress DB (Optional if you want to log every attempt)
        // await pool.query(...)

        res.json({
            isCorrect,
            correctAnswer: originalContent // Return correct answer ONLY after submission
        });

    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

// SAVE PROGRESS (BACKGROUND SYNC)
app.post('/api/study/save-progress', async (req, res) => {
    try {
        const { lessonId, sentenceId, selectedLevel, status, currentArrangement, timeRemaining, audioCount } = req.body;

        await pool.query(`
            INSERT INTO user_progress (lesson_id, sentence_id, selected_level, status, current_arrangement, time_remaining, audio_usage_count, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            ON CONFLICT (lesson_id, sentence_id) 
            DO UPDATE SET 
                selected_level = EXCLUDED.selected_level,
                status = EXCLUDED.status,
                current_arrangement = EXCLUDED.current_arrangement,
                time_remaining = EXCLUDED.time_remaining,
                audio_usage_count = EXCLUDED.audio_usage_count,
                updated_at = NOW();
        `, [lessonId, sentenceId, selectedLevel, status, JSON.stringify(currentArrangement), timeRemaining, audioCount]);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

// --- GROQ/GEMINI HANDWRITING RECOGNITION API ---
app.post('/api/recognize-handwriting', async (req, res) => {
    if (!groqClient && !visionModel) {
        return res.status(503).json({ error: "No AI vision providers available. Check server logs for API key issues." });
    }

    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ error: "No image data provided." });
        }

        const prompt = "Transcribe the handwritten text in this image. Be as accurate as possible. Only return the transcribed text.";
        let text;

        // Try Groq first (uses vision model)
        if (groqClient) {
            try {
                console.log("[POST /api/recognize-handwriting] Using Groq Vision Model...");

                // Groq expects base64 data without the data:image prefix
                const base64Data = image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

                const completion = await groqClient.chat.completions.create({
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: prompt },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: `data:image/png;base64,${base64Data}`
                                    }
                                }
                            ]
                        }
                    ],
                    model: "llama-3.2-90b-vision-preview",
                    temperature: 0.3,
                    max_tokens: 500
                });

                text = completion.choices[0]?.message?.content || "";
                console.log("[POST /api/recognize-handwriting] Groq Recognized Text:", text);
            } catch (groqError) {
                console.warn("[POST /api/recognize-handwriting] Groq failed, falling back to Gemini:", groqError.message);
                if (visionModel) {
                    // Fallback to Gemini
                    const imagePart = {
                        inlineData: {
                            data: image.replace(/^data:image\/(png|jpeg);base64,/, ""),
                            mimeType: "image/png"
                        }
                    };
                    const result = await visionModel.generateContent([prompt, imagePart]);
                    const response = await result.response;
                    text = response.text();
                    console.log("[POST /api/recognize-handwriting] Gemini Recognized Text:", text);
                } else {
                    throw groqError;
                }
            }
        } else if (visionModel) {
            // Use Gemini if Groq not available
            console.log("[POST /api/recognize-handwriting] Using Gemini Vision Model...");
            const imagePart = {
                inlineData: {
                    data: image.replace(/^data:image\/(png|jpeg);base64,/, ""),
                    mimeType: "image/png"
                }
            };
            const result = await visionModel.generateContent([prompt, imagePart]);
            const response = await result.response;
            text = response.text();
            console.log("[POST /api/recognize-handwriting] Gemini Recognized Text:", text);
        }

        res.json({ text });

    } catch (error) {
        console.error("[POST /api/recognize-handwriting] ERROR DETAILS:", error);
        res.status(500).json({
            error: "Failed to recognize handwriting.",
            details: error.message || error.toString()
        });
    }
});


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
