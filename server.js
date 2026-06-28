// LanguageLearn.AI backend proxy.
// Serves the static site AND exposes /api/chat, which injects the Groq API
// key server-side. The key lives only in .env and never reaches the browser.

require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 8000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

app.use(express.json());

// Serve index.html, script.js, style.css, images/ ...
app.use(express.static(__dirname));

// Chat proxy: the browser POSTs { messages }, we add the model + key.
app.post('/api/chat', async (req, res) => {
    if (!GROQ_API_KEY) {
        return res.status(500).json({
            error: { message: 'Server is missing GROQ_API_KEY. Add it to your .env file.' }
        });
    }

    const messages = req.body && req.body.messages;
    if (!Array.isArray(messages)) {
        return res.status(400).json({
            error: { message: 'Request body must include a "messages" array.' }
        });
    }

    try {
        const groqRes = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages,
                temperature: 1,
                max_tokens: 1024
            })
        });

        // Pass Groq's response (and status) straight back to the browser.
        const data = await groqRes.json();
        res.status(groqRes.status).json(data);
    } catch (err) {
        console.error('Proxy error:', err);
        res.status(502).json({ error: { message: 'Failed to reach the AI service.' } });
    }
});

app.listen(PORT, () => {
    console.log(`✅ LanguageLearn.AI running at http://localhost:${PORT}`);
});
