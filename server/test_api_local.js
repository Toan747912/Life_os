const http = require('http');

http.get('http://localhost:8080/api/lessons', (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const lessons = JSON.parse(data);
            console.log(`JSON PARSED: Found ${lessons.length} lessons`);
            if (lessons.length > 0) {
                console.log('Sample lesson:', lessons[0].title);
            }
            process.exit(0);
        } catch (e) {
            console.error('FAILED TO PARSE JSON:', e.message);
            console.error('RAW DATA:', data);
            process.exit(1);
        }
    });
}).on('error', (err) => {
    console.error('CONNECTION ERROR:', err.message);
    process.exit(1);
});
