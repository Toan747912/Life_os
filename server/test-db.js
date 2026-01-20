const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'life_os',
    password: 'ngoquoctoan1234',
    port: 5432,
});

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
