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
        console.log("Connected. Attempting insert...");

        const res = await client.query(
            'INSERT INTO goals (title, description) VALUES ($1, $2) RETURNING *',
            ['Test Goal', 'Test Description']
        );
        console.log("Insert Success:", res.rows[0]);
        client.release();
    } catch (err) {
        console.error("FULL ERROR OBJECT:", err);
        const fs = require('fs');
        fs.writeFileSync('error.json', JSON.stringify({
            message: err.message,
            code: err.code,
            detail: err.detail,
            hint: err.hint,
            schema: err.schema,
            table: err.table,
            column: err.column,
            dataType: err.dataType,
            constraint: err.constraint
        }, null, 2));
    } finally {
        await pool.end();
    }
})();
