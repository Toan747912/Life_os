// Helper script to seed a lesson
async function seed() {
    const lesson = {
        title: "Transformation Challenge 1 (Demo)",
        sentences: [
            {
                content: "It has been two years since I saw him",
                prompt: "I haven't seen him for two years. (SINCE)",
                distractors: ["ago", "before", "time", "when"]
            },
            {
                content: "She is too young to drive a car",
                prompt: "She isn't old enough to drive a car. (TOO)",
                distractors: ["very", "so", "much", "little"]
            },
            {
                content: "Unless you hurry you will miss the bus",
                prompt: "If you don't hurry, you will miss the bus. (UNLESS)",
                distractors: ["if", "only", "must", "can"]
            }
        ]
    };

    console.log("Seeding to http://localhost:8080/api/structured-lesson...");
    try {
        const res = await fetch('http://localhost:8080/api/structured-lesson', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lesson)
        });
        const data = await res.json();
        console.log("Response:", data);
        if (data.success) console.log("✅ Seeded successfully! Lesson ID:", data.lessonId);
        else console.error("❌ Failed:", data);
    } catch (e) {
        console.error("❌ Error:", e.message);
    }
}

seed();
