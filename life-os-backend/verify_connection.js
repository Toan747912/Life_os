require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const fs = require('fs');
const logFile = 'verify_output.txt';

function log(message) {
    console.log(message);
    fs.appendFileSync(logFile, message + '\n');
}

async function main() {
    fs.writeFileSync(logFile, ''); // Clear file
    log("--- Starting Verification ---");

    // 1. Check Env Vars availability
    log("Checking environment variables...");
    if (!process.env.DATABASE_URL) {
        log("❌ DATABASE_URL is missing.");
        // process.exit(1); // Don't exit, try detailed checks
    }
    if (!process.env.GEMINI_API_KEY) {
        log("❌ GEMINI_API_KEY is missing.");
        // process.exit(1); // Don't exit, try detailed checks
    }
    log("✅ Environment variables present.");

    // 2. Test Database Connection
    log("Testing Database Connection...");
    const prisma = new PrismaClient();
    try {
        await prisma.$connect();
        log("✅ Database connection successful.");
    } catch (error) {
        log("❌ Database connection failed: " + error.message);
    } finally {
        await prisma.$disconnect();
    }

    // 3. Test Gemini API
    log("Testing Gemini API Key...");
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Use gemini-1.5-flash as it is safer/more likely to be available, or stick to what user has.
        // User's code uses gemini-2.0-flash. Let's test that first, if fail, try 1.5.
        const modelName = "gemini-2.0-flash";
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = "Hello, are you working?";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        log(`✅ Gemini API (${modelName}) working. Response: ${text.substring(0, 20)}...`);
    } catch (error) {
        log(`❌ Gemini API (gemini-2.0-flash) failed: ` + error.message);
        if (error.message.includes("404") || error.message.includes("not found")) {
            log("⚠️  Model gemini-2.0-flash not found. Trying gemini-1.5-flash...");
            try {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent("Test");
                log("✅ Gemini API (gemini-1.5-flash) working.");
            } catch (e2) {
                log("❌ Gemini API (gemini-1.5-flash) also failed: " + e2.message);
            }
        }
    }

    log("--- Verification Complete ---");
}

main();
