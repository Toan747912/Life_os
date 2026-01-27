const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'life_os',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

const sql = `
-- 1. Create Resources Table
CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,
    goal_id INTEGER REFERENCES goals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT,
    type VARCHAR(50) DEFAULT 'ARTICLE', -- ARTICLE, VIDEO, BOOK
    status VARCHAR(50) DEFAULT 'NEW', -- NEW, DIGESTING, MASTERED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Update Posts Table (Add Review Status)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, IN_REVIEW, PUBLISHED
ADD COLUMN IF NOT EXISTS ai_feedback TEXT; -- AI Feedback

-- 3. Update Goals Table (Add progress)
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
`;

async function runMigration() {
    try {
        await client.connect();
        console.log('Connected to database.');
        await client.query(sql);
        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
