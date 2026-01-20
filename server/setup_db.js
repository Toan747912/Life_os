const { Client } = require('pg');

const config = {
    user: 'postgres',
    password: 'ngoquoctoan1234', // Using the password you provided
    host: 'localhost',
    port: 5432,
};

const setup = async () => {
    // 1. Connect to default 'postgres' db to create the new database
    const client1 = new Client({ ...config, database: 'postgres' });
    try {
        await client1.connect();
        console.log("Connected to 'postgres' database.");

        // Check if database exists
        const res = await client1.query("SELECT 1 FROM pg_database WHERE datname = 'life_os'");
        if (res.rowCount === 0) {
            console.log("Database 'life_os' not found. Creating...");
            await client1.query('CREATE DATABASE life_os');
            console.log("Database 'life_os' created successfully.");
        } else {
            console.log("Database 'life_os' already exists.");
        }
    } catch (err) {
        console.error("Error creating database:", err);
        process.exit(1);
    } finally {
        await client1.end();
    }

    // 2. Connect to the new 'life_os' db to create tables
    const client2 = new Client({ ...config, database: 'life_os' });
    try {
        await client2.connect();
        console.log("Connected to 'life_os' database.");

        const createTablesQuery = `
      CREATE TABLE IF NOT EXISTS lessons (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sentences (
          id SERIAL PRIMARY KEY,
          lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          meaning TEXT,
          "order" INT
      );
    `;

        await client2.query(createTablesQuery);
        console.log("Tables 'lessons' and 'sentences' created successfully.");

    } catch (err) {
        console.error("Error creating tables:", err);
    } finally {
        await client2.end();
    }
};

setup();
