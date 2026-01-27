const express = require('express');
const path = require('path');
const { generateEmbedding, generateText, reviewPostSocratic } = require('./services/aiService');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
// --- CONFIGURATION ---
const app = express();
app.use(cors());
// Tăng giới hạn của body-parser để nhận ảnh base64
app.use(bodyParser.json({ limit: '10mb' }));

// --- CẤU HÌNH AI PROVIDERS ---
// logic moved to services/aiService.js

// CẤU HÌNH KẾT NỐI DATABASE
const pool = new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        }
        : {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
        }
);

// --- DB MIGRATION CHECK ---
(async () => {
    try {
        const client = await pool.connect();
        let hasVector = false;

        // 1. Ensure 'vector' extension exists (CRITICAL for Life OS)
        try {
            await client.query('CREATE EXTENSION IF NOT EXISTS vector');
            hasVector = true;
            console.log("✅ DB Migration: 'vector' extension verified.");
        } catch (e) {
            console.warn("⚠️  DB Migration Warning: Failed to enable 'vector' extension. Falling back to JSONB storage for vectors.");
        }

        const vectorType = hasVector ? 'vector(768)' : 'JSONB';

        // 2. Life OS Tables
        // 2.1 Goals
        await client.query(`
            CREATE TABLE IF NOT EXISTS goals (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                status VARCHAR(50) DEFAULT 'PLANNING', -- PLANNING, IN_PROGRESS, COMPLETED
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2.2 Resources
        await client.query(`
            CREATE TABLE IF NOT EXISTS resources (
                id SERIAL PRIMARY KEY,
                goal_id INTEGER REFERENCES goals(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                url TEXT,
                type VARCHAR(50), -- ARTICLE, VIDEO, BOOK
                status VARCHAR(50) DEFAULT 'NEW', -- NEW, DIGESTING, MASTERED
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Update resources table to include content column
        await client.query(`ALTER TABLE resources ADD COLUMN IF NOT EXISTS content TEXT`);
        // Ensure type column exists
        await client.query(`ALTER TABLE resources ADD COLUMN IF NOT EXISTS type VARCHAR(50)`);
        // Optional: Set default type
        await client.query(`ALTER TABLE resources ALTER COLUMN type SET DEFAULT 'TEXT'`);

        // 2.3 Posts (The Brain Nodes)
        await client.query(`
            CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT,
                content_vector ${vectorType}, 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2.4 Post_Resources (Link Input to Output)
        await client.query(`
            CREATE TABLE IF NOT EXISTS post_resources (
                post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
                resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
                PRIMARY KEY (post_id, resource_id)
            )
        `);

        // 2.5 Post Links (Edges)
        await client.query(`
            CREATE TABLE IF NOT EXISTS post_links (
                source_post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
                target_post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
                link_type VARCHAR(50), -- SUPPORTS, CONTRADICTS, RELATES_TO
                PRIMARY KEY (source_post_id, target_post_id)
            )
        `);

        // Ensure 'link_type' column exists (Migration Fix)
        try {
            await client.query(`ALTER TABLE post_links ADD COLUMN IF NOT EXISTS link_type VARCHAR(50)`);
        } catch (e) {
            console.warn("Migration: link_type column already exists or error", e.message);
        }

        // Ensure columns exist in 'posts' (Migration Fix)
        const postColumns = [
            { cmd: `ALTER TABLE posts ADD COLUMN IF NOT EXISTS goal_id INTEGER REFERENCES goals(id)` },
            { cmd: `ALTER TABLE posts ADD COLUMN IF NOT EXISTS content TEXT` },
            { cmd: `ALTER TABLE posts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` },
            { cmd: `ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` },
            { cmd: `ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_vector ${vectorType}` }
        ];

        for (const col of postColumns) {
            try {
                await client.query(col.cmd);
            } catch (e) {
                console.warn(`Migration Warning: Failed to run "${col.cmd}":`, e.message);
            }
        }

        // 3. Learning App Tables (Legacy Support)
        await client.query(`
            CREATE TABLE IF NOT EXISTS lessons (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                type TEXT DEFAULT 'STANDARD',
                created_at TIMESTAMP DEFAULT NOW(),
                content_vector ${vectorType},
                tags TEXT[],
                concepts JSONB
            )
        `);

        // ... [Existing Learning App Migrations] ...
        await client.query(`ALTER TABLE lessons ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'STANDARD'`);

        // Ensure 'sentences' table
        await client.query(`
            CREATE TABLE IF NOT EXISTS sentences (
                id SERIAL PRIMARY KEY,
                lesson_id INTEGER REFERENCES lessons(id),
                content TEXT NOT NULL,
                "order" INTEGER,
                difficulty TEXT,
                word_count INTEGER,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Add columns to sentences
        const sentenceColumns = [
            { name: 'context', type: 'TEXT' },
            { name: 'prompt', type: 'TEXT' },
            { name: 'distractors', type: 'TEXT' }
        ];
        for (const col of sentenceColumns) {
            await client.query(`ALTER TABLE sentences ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
        }

        // Ensure 'user_progress'
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_progress (
                id SERIAL PRIMARY KEY,
                lesson_id INTEGER REFERENCES lessons(id),
                sentence_id INTEGER REFERENCES sentences(id),
                selected_level INTEGER,
                status TEXT,
                current_arrangement JSONB,
                time_remaining INTEGER,
                audio_usage_count INTEGER,
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(lesson_id, sentence_id)
            )
        `);

        client.release();
        console.log(`✅ DB Migration: All tables verified. Vector Mode: ${hasVector ? 'ON' : 'OFF (JSON Mode)'}`);
    } catch (err) {
        console.error("❌ DB Migration Failed:", err);
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

// --- LIFE OS APIS (GOALS, RESOURCES, POSTS) ---

// 1. HEALTH CHECK
app.get('/api/health', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        res.json({ status: 'ok', time: result.rows[0].now });
    } catch (err) {
        console.error('[Health Check] Failed:', err);
        res.status(500).json({ status: 'error', error: err.message, details: err });
    }
});

// 2. GOALS
app.get('/api/goals', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM goals ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('[GET /api/goals] Database Error:', err); // Enhanced logging
        res.status(500).json({ error: "Failed to fetch goals", details: err.message, fullError: err });
    }
});

app.post('/api/goals', async (req, res) => {
    try {
        const { title, description } = req.body;
        const result = await pool.query('INSERT INTO goals (title, description) VALUES ($1, $2) RETURNING *', [title, description]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('[POST /api/goals] Database Error:', err); // Enhanced logging
        res.status(500).json({ error: "Failed to create goal", details: err.message, fullError: err });
    }
});

// 2. RESOURCES
app.get('/api/resources', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM resources ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('[GET /api/resources] Error:', err);
        res.status(500).json({ error: err.message, details: err });
    }
});

app.post('/api/resources', async (req, res) => {
    try {
        const { goal_id, title, url, type, content } = req.body;
        const result = await pool.query(
            'INSERT INTO resources (goal_id, title, url, type, content) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [goal_id, title, url, type || 'TEXT', content]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('[POST /api/resources] Error:', err);
        res.status(500).json({ error: err.message, details: err });
    }
});

// 3. POSTS (BRAIN NODES) with EMBEDDINGS
app.get('/api/posts', async (req, res) => {
    try {
        const { goal_id } = req.query;
        let query = 'SELECT id, title, content, created_at, updated_at FROM posts';
        const params = [];

        if (goal_id) {
            query += ' WHERE goal_id = $1 ORDER BY created_at DESC';
            params.push(goal_id);
        } else {
            query += ' ORDER BY created_at DESC';
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('[GET /api/posts] Error:', err);
        res.status(500).json({ error: err.message, details: err });
    }
});

app.post('/api/posts', async (req, res) => {
    try {
        const { title, content, goal_id } = req.body;

        let vector = null;
        try {
            // Generate embedding if content exists
            if (content) {
                vector = await generateEmbedding(content);
            }
        } catch (e) {
            console.warn("⚠️ Failed to generate embedding for post:", e.message);
        }

        // Updated query to include goal_id
        const columns = ['title', 'content'];
        const values = [title, content];
        const placeholders = ['$1', '$2'];

        if (vector) {
            columns.push('content_vector');
            values.push(`[${vector}]`);
            placeholders.push(`$${values.length}`);
        }

        if (goal_id) {
            columns.push('goal_id');
            values.push(goal_id); // Assuming goal_id is passed
            placeholders.push(`$${values.length}`);
        }

        const query = `INSERT INTO posts (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id, title`;

        const result = await pool.query(query, values);
        res.json(result.rows[0]);
    } catch (err) {
        console.error("[POST /api/posts] Create Post Error:", err);
        res.status(500).json({ error: err.message, details: err });
    }
});

// 4. SEMANTIC SEARCH
app.post('/api/posts/similar', async (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "No content provided" });

    try {
        const vector = await generateEmbedding(content);

        // Check if pgvector is available by trying a test query or just fallback on error
        // Actually, let's try the vector query first
        try {
            const query = `
                SELECT id, title, content, created_at,
                (content_vector <-> $1) as distance 
                FROM posts
                WHERE content_vector IS NOT NULL
                ORDER BY distance ASC
                LIMIT 5;
            `;
            const result = await pool.query(query, [`[${vector}]`]);
            res.json(result.rows);
        } catch (pgError) {
            // Fallback: In-memory Cosine Similarity (If pgvector not installed)
            console.warn("⚠️ pgvector query failed (likely missing extension). Falling back to JS search.", pgError.message);

            const allPostsRes = await pool.query('SELECT id, title, content, content_vector FROM posts WHERE content_vector IS NOT NULL');
            const allPosts = allPostsRes.rows;

            // Compute distance manually
            const similarPosts = allPosts.map(post => {
                let dbVector = post.content_vector;
                // If stored as JSONB, it might be an array already
                if (typeof dbVector === 'string') dbVector = JSON.parse(dbVector);

                // Simple Euclidean Distance
                const dist = euclideanDistance(vector, dbVector);
                return { ...post, distance: dist };
            })
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 5);

            res.json(similarPosts);
        }
    } catch (err) {
        console.error("Semantic Search Error:", err);
        res.status(500).json({ error: "Search failed", details: err.message });
    }
});

// 5. SOCRATIC REVIEW
app.post('/api/posts/review', async (req, res) => {
    const { content, resourceContext } = req.body;
    try {
        const feedback = await reviewPostSocratic(content, resourceContext);
        res.json({ feedback });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

function euclideanDistance(a, b) {
    if (!a || !b || a.length !== b.length) return 9999;
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
}

// --- LEGACY APIS ---

// API 1: Lấy danh sách bài học
app.get('/api/lessons', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM lessons 
            ORDER BY id DESC
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

        // Ensure distractors are parsed if they are JSON strings or Postgres arrays
        const rows = result.rows.map(row => {
            if (row.distractors && typeof row.distractors === 'string') {
                try {
                    if (row.distractors.startsWith('{')) {
                        // Handle Postgres array format fallback if repair script missed something
                        row.distractors = row.distractors.substring(1, row.distractors.length - 1)
                            .split(',')
                            .map(s => s.trim().replace(/^"|"$/g, ''));
                    } else {
                        row.distractors = JSON.parse(row.distractors);
                    }
                } catch (e) {
                    console.error(`Failed to parse distractors for sentence ${row.id}:`, e.message);
                    row.distractors = [];
                }
            }
            return row;
        });

        res.json(rows);
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
        const lessonRes = await client.query('INSERT INTO lessons(title, type) VALUES($1, $2) RETURNING id', [title, 'STANDARD']);
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
        const type = req.body.type || 'TRANSFORMATION';
        const lessonRes = await client.query('INSERT INTO lessons(title, type) VALUES($1, $2) RETURNING id', [title, type]);
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
// API 3.6: Generate Distractors (via aiService)
app.post('/api/generate-distractors', async (req, res) => {
    const { sentence, prompt } = req.body;
    try {
        const aiPrompt = `
            Task: Generate 5-6 single-word distractors for a sentence scrambling game.
            Target Sentence: "${sentence}"
            ${prompt ? `Keyword: "${prompt}"` : ''}
            
            Rules:
            1. The distractors should be grammatically plausible but incorrect in the context of the target sentence.
            2. They should be related words.
            3. Do NOT include words that are already in the target sentence.
            4. Return ONLY a JSON array of strings.
            
            Example Output: ["bad", "mistake", "error"]
        `;

        const text = await generateText(aiPrompt, true); // true = jsonMode hint

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("No JSON array found");

        const distractors = JSON.parse(jsonMatch[0]);
        res.json({ distractors });
    } catch (error) {
        console.error("[POST /api/generate-distractors] ERROR:", error);
        res.status(500).json({ error: "Failed to generate distractors" });
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

// --- AI & GRAPH APIS ---

// (Removed redundant getEmbedding function in favor of aiService)

// Helper for Text Generation (Handles Groq/Gemini fallback)
// (Removed redundant generateText function in favor of aiService)

// API 1: Socratic Review (The Challenger)
// API 1: Socratic Review (via aiService)
app.post('/api/ai/review', async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ error: "No content provided" });

        const feedback = await socraticReview(content);
        res.json({ feedback });
    } catch (err) {
        console.error("[Socratic Review] Error:", err);
        res.status(500).json({ error: err.message });
    }
});



// API 2: Knowledge Graph Node Extractor (The Librarian)
app.post('/api/ai/extract', async (req, res) => {
    const { content, lessonId } = req.body;
    if (!content) return res.status(400).json({ error: "No content provided" });

    const prompt = `
        Bạn là một chuyên gia về Cấu trúc dữ liệu và Quản lý tri thức (Knowledge Management). Nhiệm vụ của bạn là phân tích văn bản và trích xuất các thành phần để xây dựng "Mạng lưới tri thức" (Knowledge Graph).

        NHIỆM VỤ:
        1. Đọc văn bản đầu vào.
        2. Trích xuất 3-5 "Concept Nodes" (Khái niệm danh từ) quan trọng nhất. Đây phải là các thuật ngữ chuyên môn hoặc chủ thể chính.
        3. Xác định "Mục đích chính" (Intent) của bài viết.
        4. Đề xuất 3 Tags liên quan.

        BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON:
        {
          "summary": "Tóm tắt nội dung bài viết trong 1 câu ngắn gọn.",
          "core_concepts": ["Concept A", "Concept B", "Concept C"],
          "content_type": "Tutorial | Definition | Opinion | Case Study",
          "suggested_tags": ["tag1", "tag2", "tag3"]
        }

        User Message: "${content}"
    `;

    try {
        const jsonStr = await generateText(prompt, 0.2, true);
        const data = JSON.parse(jsonStr);

        // Auto-save to DB if lessonId is provided
        if (lessonId) {
            const client = await pool.connect();
            try {
                await client.query(
                    'UPDATE lessons SET tags = $1, concepts = $2 WHERE id = $3',
                    [data.suggested_tags, JSON.stringify(data.core_concepts), lessonId]
                );
            } finally {
                client.release();
            }
        }

        res.json(data);
    } catch (e) {
        console.error("[POST /api/ai/extract] Error:", e);
        res.status(500).json({ error: "Failed to extract concepts" });
    }
});

// API 3: Related Posts + Synthesizer (Enhanced)
app.post('/api/ai/related', async (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "No content provided" });

    try {
        // 1. Generate Embedding for the draft
        const vector = await getEmbedding(content);

        // 2. Search in DB
        const vectorStr = `[${vector.join(',')}]`;

        const result = await pool.query(`
            SELECT id, title, content, 
            (content_vector <-> $1) as distance 
            FROM lessons 
            WHERE content_vector IS NOT NULL
            ORDER BY distance ASC 
            LIMIT 5
        `, [vectorStr]);

        res.json(result.rows);

    } catch (e) {
        console.error("[POST /api/ai/related] Error:", e);
        res.json([]);
    }
});

// API 4: The Synthesizer (Connect A and B)
app.post('/api/ai/connect', async (req, res) => {
    const { contentA, contentB, titleB } = req.body;

    const prompt = `
        Bạn là một Trợ lý Sáng tạo (Creative Partner) chuyên về việc kết nối các ý tưởng rời rạc (Connect the dots).

        NGỮ CẢNH:
        Người dùng đang viết một bài mới (A).
        Hệ thống phát hiện một bài viết cũ (B) có liên quan.

        NHIỆM VỤ:
        Phân tích mối liên hệ tiềm năng giữa [A] và [B] để gợi ý cách kết hợp tạo Insight mới.

        Các loại liên kết cần tìm:
        - Hỗ trợ (Support): [B] có chứa bằng chứng củng cố cho [A] không?
        - Mâu thuẫn (Contradict): [B] có góc nhìn nào phản bác lại [A] không?
        - Mở rộng (Expand): [B] có phải là một ứng dụng thực tế của lý thuyết trong [A] không?

        Định dạng trả về ngắn gọn, gợi mở (Markdown):
        "💡 **Gợi ý kết nối:** Tôi thấy bạn đang viết về chủ đề này. Nó có liên quan thú vị đến bài **${titleB}**. 
        Cụ thể: [Giải thích mối liên hệ].
        👉 [Gợi ý 1 câu để user thêm vào bài viết]"

        Content A: "${contentA}"
        Content B: "${contentB}"
    `;

    try {
        const response = await generateText(prompt, 0.7);
        res.json({ insight: response });
    } catch (e) {
        console.error("[POST /api/ai/connect] Error:", e);
        res.status(500).json({ error: "Failed to synthesize connection" });
    }
});


// API: Graph Data (Nodes & Edges) - Enhanced with Concepts
// API: Graph Data (Life OS Nodes & Edges)
app.get('/api/graph/data', async (req, res) => {
    try {
        const nodes = [];
        const edges = [];

        // 1. Get Posts (Nodes)
        const postsRes = await pool.query(`SELECT id, title, content, created_at FROM posts`);
        postsRes.rows.forEach(row => {
            nodes.push({
                id: row.id.toString(),
                type: 'default', // or custom node type
                data: { label: row.title, type: 'post' },
                position: { x: Math.random() * 800, y: Math.random() * 600 }
            });
        });

        // 2. Get Post Links (Edges)
        const linksRes = await pool.query(`SELECT source_post_id, target_post_id, link_type FROM post_links`);
        linksRes.rows.forEach(row => {
            edges.push({
                id: `e${row.source_post_id}-${row.target_post_id}`,
                source: row.source_post_id.toString(),
                target: row.target_post_id.toString(),
                animated: true,
                label: row.link_type,
                style: { stroke: '#cbd5e1' }
            });
        });

        res.json({ nodes, edges });
    } catch (e) {
        console.error(e);
        res.status(500).json(e);
    }
});



// 4. Lấy chi tiết một Goal cụ thể
app.get('/api/goals/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM goals WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).send('Goal not found');
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 5. Lấy danh sách Resources của một Goal
app.get('/api/goals/:id/resources', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM resources WHERE goal_id = $1 ORDER BY created_at DESC',
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
