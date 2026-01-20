const { Client } = require('pg');
require('dotenv').config();

// Ưu tiên dùng biến môi trường DATABASE_URL (cho Cloud), nếu không có thì dùng localhost
const config = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Bắt buộc cho Neon/Render Postgres
    }
    : {
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
        console.log("Connected to 'life_os' database.");

        // 1. Add word_count to sentences if not exists
        console.log("Checking 'sentences' table...");
        try {
            await client.query("ALTER TABLE sentences ADD COLUMN word_count INT;");
            console.log("Added 'word_count' column.");
        } catch (e) {
            if (e.code === '42701') console.log("'word_count' column already exists.");
            else console.error("Error adding column:", e.message);
        }

        // Auto calculate word_count for existing data
        await client.query("UPDATE sentences SET word_count = array_length(regexp_split_to_array(trim(content), '\\s+'), 1) WHERE word_count IS NULL;");
        console.log("Updated word_count for existing sentences.");

        // 2. Create user_progress table
        console.log("Creating 'user_progress' table...");
        const createProgressTable = `
    CREATE TABLE IF NOT EXISTS user_progress (
        id SERIAL PRIMARY KEY,
        lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
        sentence_id INT REFERENCES sentences(id) ON DELETE CASCADE,
        
        selected_level INT CHECK (selected_level BETWEEN 1 AND 4),
        status VARCHAR(20) DEFAULT 'PENDING',
        current_arrangement JSONB, 
        time_remaining INT, 
        audio_usage_count INT DEFAULT 0,
        
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(lesson_id, sentence_id) 
    );
    `;
        await client.query(createProgressTable);
        console.log("'user_progress' table ensures to exist.");

        // 3. Create Trigger for updated_at
        console.log("Setting up timestamps...");
        const createFunction = `
    CREATE OR REPLACE FUNCTION update_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
       NEW.updated_at = NOW();
       RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    `;
        await client.query(createFunction);

        const createTrigger = `
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_timestamp') THEN
            CREATE TRIGGER trigger_update_timestamp
            BEFORE UPDATE ON user_progress
            FOR EACH ROW
            EXECUTE PROCEDURE update_timestamp();
        END IF;
    END
    $$;
    `;
        await client.query(createTrigger);
        console.log("Triggers set up successfully.");

        console.log("=== STEP 2: DATABASE MIGRATION COMPLETED SUCCESSFULLY ===");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
};

migrate();
