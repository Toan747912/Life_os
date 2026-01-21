const axios = require('axios');

/**
 * Fetches a summary paragraph from Wikipedia for a given topic.
 * @param {string} topic - The topic to search for (e.g., "Elephant", "Space").
 * @returns {Promise<string>} - The summary text.
 */
async function fetchWikiSummary(topic) {
    try {
        // Use MediaWiki API for summary
        // Format: https://en.wikipedia.org/api/rest_v1/page/summary/{topic}
        const encodedTopic = encodeURIComponent(topic.trim().replace(/\s+/g, '_'));
        const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTopic}`);

        if (response.data && response.data.extract) {
            return response.data.extract;
        } else {
            throw new Error("No content found");
        }
    } catch (error) {
        console.error(`Wiki fetch failed for ${topic}:`, error.message);
        throw new Error("Could not find article for this topic. Try a more specific term.");
    }
}

module.exports = {
    fetchWikiSummary
};
