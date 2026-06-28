# LanguageLearn.AI · L².ai

An AI-powered language-learning chat app. Tell **Fluencer AI** your name, mother tongue, the language you want to learn, and your level — then practice through text **or voice** conversations. Powered by the [Groq](https://groq.com) API (`llama-3.1-8b-instant`).

---

## ✨ Features

- **Personalized tutor** — builds a system prompt from your name, native language, target language, and skill level.
- **Modern chat UI** — message bubbles, typing indicator, avatars, and a responsive chat window.
- **Voice mode** — speak to the AI and hear it reply, using the browser's Web Speech API (speech-to-text + text-to-speech).
- **Secure by design** — the Groq API key lives **only on the backend**. It is never exposed to the browser.

---

## 🏗️ How it works

The browser never talks to Groq directly. It calls our own backend, which adds the secret key server-side:

```
Browser  →  /api/chat  (server.js, reads key from .env)  →  Groq API
```

This means you can deploy the site publicly without leaking your API key.

| File | Purpose |
|------|---------|
| `index.html` | Page markup and the chat window |
| `style.css` | Styling, including the chat UI |
| `script.js` | Frontend logic — conversation, voice, calls `/api/chat` (no key here) |
| `server.js` | Express server: serves the site **and** proxies chat requests to Groq |
| `.env` | Holds your `GROQ_API_KEY` — **never committed** |
| `.env.example` | Template showing which variables to set |

---

## 🚀 Getting started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18 or newer
- A free Groq API key from <https://console.groq.com/keys>

### 2. Install dependencies
```bash
npm install
```

### 3. Add your API key
Copy the example env file and paste your key into it:
```bash
cp .env.example .env
```
Then edit `.env`:
```
GROQ_API_KEY=your_groq_api_key_here
PORT=8000
```

### 4. Run it
```bash
npm start
```
Open **<http://localhost:8000>** in your browser.

---

## 🎤 Using voice mode

1. Open the chat and click the **microphone** button.
2. Allow microphone access when prompted.
3. Speak — your words are transcribed and sent; the AI's reply is read aloud.
4. Click **stop** to end voice mode.

> **Note:** Voice mode uses the Web Speech API, which works in **Chrome and Edge** and requires the page to be served over `http://localhost` or `https://` (not opened as a `file://`). Running via `npm start` satisfies this.

---

## 🔒 Security notes

- The API key is read from `.env` on the server and injected into requests in `server.js`. It is **never** sent to the browser, so it won't show up in DevTools or the page source.
- `.env` is listed in `.gitignore`, so your key won't be committed. Only `.env.example` (with no real key) is tracked.
- If a key is ever exposed, revoke it at <https://console.groq.com/keys> and put a new one in `.env`.

---

## ☁️ Deployment

`server.js` is a standard Node/Express app and runs on any Node host (Render, Railway, Fly.io, etc.). Set the `GROQ_API_KEY` environment variable in your host's dashboard instead of using a `.env` file. The proxy can also be adapted into a serverless function (Vercel, Netlify, Cloudflare Workers).

---

## 🛠️ Tech stack

- **Frontend:** HTML, CSS, vanilla JavaScript, Web Speech API
- **Backend:** Node.js, Express
- **AI:** Groq API — `llama-3.1-8b-instant`
