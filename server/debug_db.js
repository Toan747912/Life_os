const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');

console.log("--- DEBUG START ---");
console.log("Current Directory:", __dirname);
console.log("Env Path:", path.join(__dirname, '.env'));
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PORT:", process.env.DB_PORT);
// Do not log password for security, just check if it exists
console.log("DB_PASSWORD exists:", !!process.env.DB_PASSWORD);

const poolConfig = process.env.DATABASE_URL
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
    };

console.log("Pool Config:", JSON.stringify(poolConfig, null, 2));

const pool = new Pool(poolConfig);

(async () => {
    try {
        console.log("Attempting to connect...");
        const client = await pool.connect();
        console.log("✅ Connection Successful!");
        const res = await client.query('SELECT NOW()');
        console.log("Query Result:", res.rows[0]);
        client.release();
    } catch (err) {
        console.error("❌ Connection Failed:", err);
    } finally {
        await pool.end();
        console.log("--- DEBUG END ---");
    }
})();
