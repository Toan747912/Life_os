const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
require('dotenv').config();

async function listAllModels() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        console.log("Using API Key:", apiKey.slice(0, 5) + "...");
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        console.log("All Models available for this key:");
        response.data.models.forEach(m => {
            console.log(`- ID: ${m.name} (methods: ${m.supportedGenerationMethods.join(', ')})`);
        });

        process.exit(0);
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

listAllModels();
