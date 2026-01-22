const { Client } = require('pg');

const config = {
    user: 'postgres',
    password: 'ngoquoctoan1234',
    host: 'localhost',
    port: 5432,
    database: 'life_os'
};

const migrate = async () => {
    const client = new Client(config);
    try {
        await client.connect();
        console.log("Connected to database...");

        // Add 'prompt' column
        const checkPrompt = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='sentences' AND column_name='prompt';
        `);
        if (checkPrompt.rowCount === 0) {
            await client.query('ALTER TABLE sentences ADD COLUMN prompt TEXT;');
            console.log("Added 'prompt' column.");
        } else {
            console.log("'prompt' column already exists.");
        }

        // Add 'distractors' column (Storing as JSONB array of strings)
        const checkDistractors = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='sentences' AND column_name='distractors';
        `);
        if (checkDistractors.rowCount === 0) {
            await client.query('ALTER TABLE sentences ADD COLUMN distractors JSONB DEFAULT \'[]\'');
            console.log("Added 'distractors' column.");
        } else {
            console.log("'distractors' column already exists.");
        }

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
};

migrate();
