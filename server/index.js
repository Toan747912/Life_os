const express = require('express');
require('dotenv').config();
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

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
        const result = await pool.query('SELECT * FROM lessons ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
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
            const { shuffled_words, word_count } = processSentenceForLevel(s.content, level, sentences);
            return {
                id: s.id,
                shuffled_words, // Anti-cheat: Only return shuffled words
                time_limit: calculateTimeLimit(word_count, level),
                difficulty: s.difficulty // For reference
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
