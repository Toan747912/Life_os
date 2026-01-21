const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgres://postgres:ngoquoctoan1234@localhost:5432/life_os"
});

const migrate = async () => {
    try {
        console.log("Adding 'text' column to 'lessons' table...");
        await pool.query("ALTER TABLE lessons ADD COLUMN IF NOT EXISTS text TEXT;");
        console.log("Success! Column 'text' added or already exists.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
};

migrate();
