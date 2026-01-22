const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'life_os',
    password: 'ngoquoctoan1234',
    port: 5432,
});

async function verifyDb() {
    try {
        const client = await pool.connect();
        console.log("✅ Connected to local database.");

        const tableCheck = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('lessons', 'sentences', 'user_progress')
        `);
        console.log("Tables found:", tableCheck.rows.map(r => r.table_name));

        const columnCheck = await client.query(`
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'sentences'
        `);
        console.log("Columns in 'sentences':", columnCheck.rows.map(r => r.column_name));

        client.release();
        process.exit(0);
    } catch (err) {
        console.error("❌ Database Verification Failed:", err.message);
        process.exit(1);
    }
}

verifyDb();
