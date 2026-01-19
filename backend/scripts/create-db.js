const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function createDatabase() {
    const envPath = path.resolve(__dirname, '../.env');
    let envConfig = {};

    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim(); // handle values with =
                if (key && value) envConfig[key] = value;
            }
        });
    }

    const client = new Client({
        host: envConfig.DB_HOST || 'localhost',
        port: parseInt(envConfig.DB_PORT || '5432', 10),
        user: envConfig.DB_USERNAME || 'postgres',
        password: envConfig.DB_PASSWORD || 'postgres',
        database: 'postgres',
    });

    try {
        await client.connect();
        const dbName = envConfig.DB_NAME || 'study_os';

        // Check if database exists
        const res = await client.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [dbName]
        );

        if (res.rowCount === 0) {
            console.log(`Database "${dbName}" does not exist. Creating...`);
            await client.query(`CREATE DATABASE "${dbName}"`);
            console.log(`Database "${dbName}" created successfully.`);
        } else {
            console.log(`Database "${dbName}" already exists.`);
        }
    } catch (err) {
        console.error('Error creating database:', err);
    } finally {
        await client.end();
    }
}

createDatabase();
