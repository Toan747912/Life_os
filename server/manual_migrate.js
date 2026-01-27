const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Adding updated_at...");
        await client.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        console.log("Success!");
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
