
const fetch = require('node-fetch');

const API_URL = 'http://localhost:8080/api';

async function testLessonDetails() {
    try {
        // 1. Get all lessons to find a TRANSFORMATION one
        const res = await fetch(`${API_URL}/lessons`);
        const lessons = await res.json();
        const transformLesson = lessons.find(l => l.type === 'TRANSFORMATION');

        if (!transformLesson) {
            console.log("No TRANSFORMATION lesson found.");
            return;
        }

        console.log(`Found Transformation Lesson: ${transformLesson.title} (ID: ${transformLesson.id})`);

        // 2. Get details
        const detailRes = await fetch(`${API_URL}/lessons/${transformLesson.id}`);
        const sentences = await detailRes.json();

        if (sentences.length > 0) {
            console.log("First sentence sample:");
            console.log(JSON.stringify(sentences[0], null, 2));

            console.log("Distractors type:", typeof sentences[0].distractors);
            if (typeof sentences[0].distractors === 'string') {
                console.log("Distractors is string, needs parsing?");
            }
        } else {
            console.log("Lesson has no sentences.");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

testLessonDetails();
