const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Fallback if env vars are individual
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined
});

async function check() {
    try {
        const client = await pool.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'posts';
        `);
        console.log("Columns:", res.rows.map(r => r.column_name).join(', '));
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
