const { Client } = require('pg');

const config = {
    user: 'postgres',
    password: 'ngoquoctoan1234',
    host: 'localhost',
    database: 'life_os',
    port: 5432,
};

const migrate = async () => {
    const client = new Client(config);
    try {
        await client.connect();
        console.log("Connected to database...");

        await client.query('BEGIN');

        // Add 'example' column to vocabulary if it doesn't exist
        console.log("Adding 'example' column to vocabulary...");
        await client.query(`
            ALTER TABLE vocabulary 
            ADD COLUMN IF NOT EXISTS example TEXT;
        `);

        await client.query('COMMIT');
        console.log("Migration V6 successful!");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
};

migrate();
