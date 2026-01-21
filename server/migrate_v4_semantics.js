const { Client } = require('pg');
require('dotenv').config();

// Configuration matching index.js and previous migrations
const config = {
    user: 'postgres',
    password: 'ngoquoctoan1234',
    host: 'localhost',
    database: 'life_os',
    port: 5432,
};

const migrate = async () => {
    const client = new Client(config);
    try {
        await client.connect();
        console.log("Connected to 'life_os' database for Semantic Master migration.");

        console.log("Beginning migration v4: Semantic Master Tables...");

        // 1. Create 'vocabulary' table
        console.log("Creating 'vocabulary' table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS vocabulary (
                id SERIAL PRIMARY KEY,
                word VARCHAR(100) NOT NULL UNIQUE,
                part_of_speech VARCHAR(20), -- Noun, Verb, Adj...
                definition TEXT,            -- English definition
                meaning_vi TEXT             -- Vietnamese meaning
            );
        `);
        console.log("'vocabulary' table created/verified.");

        // 2. Create 'word_relations' table
        console.log("Creating 'word_relations' table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS word_relations (
                id SERIAL PRIMARY KEY,
                word_id_1 INT REFERENCES vocabulary(id) ON DELETE CASCADE,
                word_id_2 INT REFERENCES vocabulary(id) ON DELETE CASCADE,
                
                -- Relation types: 'SYNONYM', 'ANTONYM', 'COLLOCATION'
                relation_type VARCHAR(20) NOT NULL, 
                
                -- Context example (especially for Collocations)
                example_sentence TEXT,
                
                -- Ensure no duplicate relations in same direction
                UNIQUE(word_id_1, word_id_2, relation_type)
            );
        `);
        console.log("'word_relations' table created/verified.");

        // 3. Create 'semantic_lessons' table
        console.log("Creating 'semantic_lessons' table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS semantic_lessons (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("'semantic_lessons' table created/verified.");

        // 4. Create 'lesson_vocab_map' table
        console.log("Creating 'lesson_vocab_map' table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS lesson_vocab_map (
                lesson_id INT REFERENCES semantic_lessons(id) ON DELETE CASCADE,
                vocab_id INT REFERENCES vocabulary(id) ON DELETE CASCADE,
                PRIMARY KEY (lesson_id, vocab_id)
            );
        `);
        console.log("'lesson_vocab_map' table created/verified.");

        console.log("=== WRAPPING UP: MIGRATION V4 COMPLETED SUCCESSFULLY ===");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
};

migrate();
