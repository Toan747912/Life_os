const http = require('http');

http.get('http://localhost:8080/api/posts?goal_id=1', (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        try {
            console.log('Body:', JSON.stringify(JSON.parse(data), null, 2));
        } catch (e) {
            console.log('Body:', data);
        }
    });
}).on('error', (err) => {
    console.log('Error:', err.message);
});
