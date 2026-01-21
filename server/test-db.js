const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        }
        : {
            user: 'postgres',
            host: 'localhost',
            database: 'life_os',
            password: 'ngoquoctoan1234',
            port: 5432,
        }
);

async function testConnection() {
    try {
        console.log("Connecting to DB...");
        const client = await pool.connect();
        console.log("Connected directly!");

        try {
            console.log("Querying lessons...");
            const res = await client.query('SELECT * FROM lessons LIMIT 1');
            console.log("Lessons query success:", res.rows);
        } catch (e) {
            console.error("Query failed:", e.message);
        } finally {
            client.release();
        }

    } catch (err) {
        console.error("Connection failed:", err.message);
    } finally {
        await pool.end();
    }
}

testConnection();
