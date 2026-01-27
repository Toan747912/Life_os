const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

(async () => {
    try {
        console.log("Connecting to DB...");
        const client = await pool.connect();

        console.log("Adding missing columns to 'goals'...");
        await client.query("ALTER TABLE goals ADD COLUMN IF NOT EXISTS description TEXT");
        await client.query("ALTER TABLE goals ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PLANNING'");

        console.log("✅ Fix applied successfully.");
        client.release();
    } catch (err) {
        console.error("❌ Schema Fix Failed:", err);
    } finally {
        await pool.end();
    }
})();
