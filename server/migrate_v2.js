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
        console.log("Connected to 'life_os' database.");

        // Check if column exists
        const res = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='sentences' AND column_name='difficulty';
    `);

        if (res.rowCount === 0) {
            console.log("Adding 'difficulty' column...");
            await client.query("ALTER TABLE sentences ADD COLUMN difficulty VARCHAR(20) DEFAULT 'EASY';");
            await client.query("UPDATE sentences SET difficulty = 'EASY' WHERE difficulty IS NULL;");
            console.log("Migration successful: 'difficulty' column added.");
        } else {
            console.log("'difficulty' column already exists. Skipping.");
        }

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
};

migrate();
