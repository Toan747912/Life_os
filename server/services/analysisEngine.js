const nlp = require('compromise');
const axios = require('axios');

// Helper: Fetch from Dictionary API
const fetchDefinition = async (word) => {
    try {
        const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (res.data && res.data.length > 0) {
            const entry = res.data[0];
            const meaningful = entry.meanings[0];
            return {
                definition: meaningful.definitions[0]?.definition || "",
                partOfSpeech: meaningful.partOfSpeech || "unknown"
            };
        }
    } catch (e) {
        // Ignore 404
    }
    return { definition: "", partOfSpeech: "unknown" };
};

// Helper: Fetch Synonyms/Antonyms from Datamuse
const fetchRelations = async (word) => {
    try {
        // rel_syn = Synonyms, rel_ant = Antonyms
        const [synRes, antRes] = await Promise.all([
            axios.get(`https://api.datamuse.com/words?rel_syn=${word}&max=5`),
            axios.get(`https://api.datamuse.com/words?rel_ant=${word}&max=3`)
        ]);

        return {
            synonyms: synRes.data.map(item => item.word),
            antonyms: antRes.data.map(item => item.word)
        };
    } catch (e) {
        console.error("Datamuse Error", e.message);
        return { synonyms: [], antonyms: [] };
    }
}

const analyzeText = async (text) => {
    console.log("Compromise analyzing:", text.substring(0, 50) + "...");
    const doc = nlp(text);

    // Normalize to root forms (e.g. houses -> house, living -> live)
    doc.compute('root');

    const sets = new Set();
    const candidates = [];

    // 1. Extract Noun Phrases (chunking phrases like "calm area")
    const phrases = doc.nouns().out('array');
    // Filter phrases that are actually multi-word (optional, but user asked for "cụm từ")
    const multiWordPhrases = phrases.filter(p => p.includes(' '));

    // 2. Extract Interesting Single Words (Adjectives, Verbs, Nouns)
    // We use the root form if available to get better dictionary matches
    const singleTerms = doc.match('(#Adjective|#Noun|#Verb)').not('(#Pronoun|#Preposition|#Conjunction|#Modal)').out('array');

    // Combine: Prioritize phrases, then single words
    const allCandidates = [...multiWordPhrases, ...singleTerms];

    // Filter and Dedupe
    const uniqueCandidates = [];
    for (const c of allCandidates) {
        // Clean punctuation (keep internal hyphens/apostrophes if needed, but remove trailing .,!?)
        let clean = c.replace(/[.,!?;:]+$/, "").trim();

        const lower = clean.toLowerCase();
        // Basic noise filter
        if (lower.length < 3) continue;
        if (sets.has(lower)) continue;

        // Avoid adding "area" if "calm area" is already added? 
        // For now, let's keep both, or maybe just phrases. 
        // Strategies: exact dedupe.
        sets.add(lower);
        uniqueCandidates.push(clean);
    }

    // Limit to top 20 to avoid overwhelming
    const limitedCandidates = uniqueCandidates.slice(0, 20);

    const results = [];
    const sentences = doc.sentences().map(s => s.text());

    for (const word of limitedCandidates) {
        // Find context sentence
        const sentence = sentences.find(s => s.toLowerCase().includes(word.toLowerCase())) || text;

        // Fetch Data (Soft Fail strategy)
        let defData = { definition: "", partOfSpeech: "Unknown" };
        let relData = { synonyms: [], antonyms: [] };

        try {
            // Only fetch dictionary for single words (APIs often fail on phrases)
            if (!word.includes(' ')) {
                [defData, relData] = await Promise.all([
                    fetchDefinition(word),
                    fetchRelations(word)
                ]);
            } else {
                // For phrases, maybe we can just say it's a Noun Phrase?
                defData.partOfSpeech = "Phrase";
                defData.definition = "Contextual phrase from lesson";
            }
        } catch (e) {
            console.log(`Failed to fetch data for ${word}`, e.message);
        }

        // ALWAYS add the word if it came from the user's text, 
        // even if no external definition found. Game needs content.
        // If definition is empty, we can use a placeholder or the context.
        if (!defData.definition) defData.definition = `(Context: ${sentence.substring(0, 50)}...)`;

        results.push({
            word: word,
            part_of_speech: defData.partOfSpeech || 'Unknown',
            definition: defData.definition,
            context: sentence,
            synonyms: relData.synonyms || [],
            antonyms: relData.antonyms || []
        });

        // Small delay to be polite to APIs
        if (!word.includes(' ')) await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
};

module.exports = { analyzeText };
