const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'life_os',
    password: 'ngoquoctoan1234',
    port: 5432,
});

async function verifyLessons() {
    try {
        console.log("Connecting to DB...");
        const client = await pool.connect();
        console.log("Connected.");

        // 1. Check existing lessons
        console.log("Checking existing lessons...");
        const res = await client.query('SELECT * FROM lessons ORDER BY id DESC');
        console.log(`Found ${res.rows.length} lessons.`);
        if (res.rows.length > 0) {
            console.log("Latest lesson:", res.rows[0]);
        }

        // 2. Insert a test lesson
        console.log("Inserting test lesson...");
        const insertRes = await client.query('INSERT INTO lessons(title) VALUES($1) RETURNING *', ['Debug Test Lesson ' + Date.now()]);
        const newLesson = insertRes.rows[0];
        console.log("Inserted lesson:", newLesson);

        // 3. Verify it exists
        const verifyRes = await client.query('SELECT * FROM lessons WHERE id = $1', [newLesson.id]);
        if (verifyRes.rows.length > 0) {
            console.log("VERIFICATION SUCCESS: Lesson found in DB.");

            // Cleanup
            await client.query('DELETE FROM lessons WHERE id = $1', [newLesson.id]);
            console.log("Cleanup: Deleted test lesson.");
        } else {
            console.error("VERIFICATION FAILED: Lesson inserted but not found.");
        }

        client.release();
    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        pool.end();
    }
}

verifyLessons();
