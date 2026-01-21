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

        // 1. Drop the old table linking to semantic_lessons
        console.log("Dropping old lesson_vocab_map...");
        await client.query(`DROP TABLE IF EXISTS lesson_vocab_map CASCADE`);

        // 2. Drop the redundant semantic_lessons table
        console.log("Dropping redundant semantic_lessons table...");
        await client.query(`DROP TABLE IF EXISTS semantic_lessons CASCADE`);

        // 3. Recreate lesson_vocab_map linking to the MAIN 'lessons' table
        console.log("Creating new lesson_vocab_map...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS lesson_vocab_map (
                lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
                vocab_id INT REFERENCES vocabulary(id) ON DELETE CASCADE,
                PRIMARY KEY (lesson_id, vocab_id)
            );
        `);

        // 4. Add index for performance
        await client.query(`CREATE INDEX IF NOT EXISTS idx_lesson_vocab_map_lesson_id ON lesson_vocab_map(lesson_id)`);

        await client.query('COMMIT');
        console.log("Migration V5 successful!");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
};

migrate();
