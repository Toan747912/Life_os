const axios = require('axios');
require('dotenv').config();
const fs = require('fs');

axios.get('https://generativelanguage.googleapis.com/v1beta/models?key=' + process.env.GEMINI_API_KEY)
    .then(r => {
        const list = r.data.models.map(m => m.name).join('\n');
        fs.writeFileSync('models_list_v2.txt', list);
        console.log("Written to models_list_v2.txt");
    })
    .catch(e => console.error(e.message));
