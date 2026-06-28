// The API key lives ONLY on the backend (see server.js / .env).
// The browser talks to our own proxy endpoint, which adds the key
// server-side and forwards the request to Groq. No secret in client code.
const apiUrl = "/api/chat";

// Retrieve user details from local storage
const username = localStorage.getItem('username') || 'User';
const mothertongue = localStorage.getItem('mothertongue') || 'English';
const language = localStorage.getItem('language') || 'English';
const level = localStorage.getItem('level') || 'BEGINNER';

// Create the system prompt dynamically
const systemprompt = `You are a helpful AI assistant named Fluencer, capable of teaching ${language} in ${mothertongue}.
Greet the user, ${username}, in ${language}. Their level is ${level}. Start from basics if the level is 'BEGINNER'.`;

// Initialize conversation history with the system prompt
let conversationHistory = [
    {
        "role": "system",
        "content": systemprompt  // Set once before starting any conversation
    }
];

// Function to show the AI chat window
function showaichattigwindow() {
    const conversationfullbox = document.querySelector('.aianduserconversationboxblur');
    conversationfullbox.style.display = "flex";
}

// Function to hide the AI chat window
function hideaichattigwindow() {
    const conversationfullbox = document.querySelector('.aianduserconversationboxblur');
    conversationfullbox.style.display = "none";
}

// Function to save user details and create the system prompt
function savetheuserdetails() {
    const username = document.getElementById('username').value;
    const mothertongue = document.getElementById('mothertounge').value;
    const language = document.getElementById('selectlanguage').value;
    const level = document.getElementById('lvlofunderstanding').value;

    // Create the system prompt
    const systemprompt = `You are a helpful AI assistant named Fluencer, capable of teaching ${language} in ${mothertongue}. 
    Greet the user, ${username}, in ${language}. Their level is ${level}. Start from basics if the level is 'BEGINNER'.`;

    // Save the values to localStorage
    localStorage.setItem('systemprompt', systemprompt);
    localStorage.setItem('username', username);
    localStorage.setItem('mothertongue', mothertongue);
    localStorage.setItem('language', language);
    localStorage.setItem('level', level);

    // Add system prompt to conversation history
    conversationHistory.push({ role: "system", content: systemprompt });

    // Notify user
    alert('Success! Your details have been saved.');

    // Optionally show chat button after saving
    const chatwithyprbtn = document.querySelector('.chatwithypr');
    if (chatwithyprbtn) {
        chatwithyprbtn.style.display = "block";
    }
}

// Function to check if the system prompt exists and show/hide the chat button accordingly
function checkforsysprompt() {
    const username = localStorage.getItem('username');
    console.log(username);  // Log for debugging

    const chatwithyprbtn = document.querySelector('.chatwithypr');
    if (username && username !== "") {
        if (chatwithyprbtn) {
            chatwithyprbtn.style.display = "block";
        }
    } else {
        if (chatwithyprbtn) {
            chatwithyprbtn.style.display = "none";
        }
    }
}

// Voice recognition and synthesis variables
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;
let isVoiceChatting = false;

// Guard: not all browsers support the Web Speech API (works in Chrome/Edge).
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
    // Configure ONCE, before ever calling start().
    recognition.lang = 'en-US';
    recognition.continuous = false;     // one phrase per session; we restart manually
    recognition.interimResults = false;
    recognition.onresult = handleVoiceInput;

    recognition.onerror = (e) => {
        console.error("Speech recognition error:", e.error);
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            alert("Microphone access is blocked. Allow mic permission and run the page over http(s)://, not as a file.");
            isVoiceChatting = false;
            setMicListening(false);
        }
    };

    // When a phrase ends and we're still chatting, listen again
    // (unless the AI is currently speaking — we restart after it finishes).
    recognition.onend = () => {
        if (isVoiceChatting && !synth.speaking) {
            try { recognition.start(); } catch (_) { /* already started */ }
        }
    };
}

// Toggle the mic button's "listening" visual state
function setMicListening(on) {
    const btn = document.getElementById('voiceToggle');
    if (btn) btn.classList.toggle('listening', on);
}

// Function to start voice chat
function startVoiceChat() {
    if (!recognition) {
        alert("Voice mode isn't supported in this browser. Use Chrome or Edge.");
        return;
    }
    isVoiceChatting = true;
    setMicListening(true);
    try {
        recognition.start();
    } catch (_) {
        // start() throws if already running — safe to ignore.
    }
}

// Function to stop voice chat
function stopVoiceChat() {
    isVoiceChatting = false;
    setMicListening(false);
    if (recognition) recognition.stop();
    if (synth.speaking) synth.cancel();
}

// Handle voice input and send to Groq API
function handleVoiceInput(event) {
    const userVoiceInput = event.results[event.results.length - 1][0].transcript;
    if (userVoiceInput && isVoiceChatting) {
        // Stop listening while the AI thinks/speaks so the mic doesn't
        // pick up the AI's own voice (feedback loop).
        recognition.stop();
        sendMessageToAI(userVoiceInput);
    }
}

// Send user input to Groq API and get AI response
async function sendMessageToAI(userInput) {
    // Add user input to conversation history and show it immediately
    conversationHistory.push({ role: "user", content: userInput });
    addUserMessage(userInput);
    const typing = showTypingIndicator();

    // We only send the conversation; the model + API key are added by the
    // backend proxy so no secret is ever exposed to the browser.
    const requestBody = {
        messages: conversationHistory
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok || !data.choices) {
            const msg = data.error ? data.error.message : `HTTP ${response.status}`;
            throw new Error(`API error: ${msg}`);
        }

        let aiResponse = data.choices[0].message.content;

        // Format and display AI response
        aiResponse = formatResponse(aiResponse);
        conversationHistory.push({ role: "assistant", content: aiResponse.plainText });
        removeTypingIndicator(typing);
        addAIMessage(aiResponse.formatted);
        speakAIResponse(aiResponse.plainText);

    } catch (error) {
        console.error("Error communicating with the API:", error);
        removeTypingIndicator(typing);
        addAIMessage(`⚠️ ${error.message}`);
    }
}

// Function to format the AI response
function formatResponse(response) {
    response = response.replace(/\* /g, '<li class="list-item">');
    if (response.includes('<li class="list-item">')) {
        response = '<ul>' + response + '</ul>';
    }
    response = response.replace(/(\*\*.*?\*\*)/g, '<strong>$1</strong>');
    response = response.replace(/(\*.*?\*)/g, '<em>$1</em>');
    response = response.replace(/##(.*?)\n/g, '<h2>$1</h2>');
    const plainText = response.replace(/<[^>]+>/g, '');
    return { formatted: response, plainText: plainText };
}

// Remove the empty-state placeholder the first time a message is added
function clearEmptyState() {
    const empty = document.querySelector('#conversation .chat-empty');
    if (empty) empty.remove();
}

// Escape user text so it can't break the HTML / inject markup
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function scrollChatToBottom() {
    const conv = document.getElementById('conversation');
    conv.scrollTop = conv.scrollHeight;
}

// Append a right-aligned user bubble
function addUserMessage(text) {
    clearEmptyState();
    const conv = document.getElementById('conversation');
    const row = document.createElement('div');
    row.className = 'msg-row user';
    row.innerHTML = `<div class="bubble user">${escapeHtml(text)}</div>`;
    conv.appendChild(row);
    scrollChatToBottom();
}

// Append a left-aligned AI bubble (html is already formatted markup)
function addAIMessage(html) {
    clearEmptyState();
    const conv = document.getElementById('conversation');
    const row = document.createElement('div');
    row.className = 'msg-row ai';
    row.innerHTML = `<div class="avatar">L²</div><div class="bubble ai">${html}</div>`;
    conv.appendChild(row);
    scrollChatToBottom();
}

// Show an animated "typing…" bubble and return the element so it can be removed
function showTypingIndicator() {
    clearEmptyState();
    const conv = document.getElementById('conversation');
    const row = document.createElement('div');
    row.className = 'msg-row ai';
    row.innerHTML = `<div class="avatar">L²</div><div class="bubble ai typing"><span></span><span></span><span></span></div>`;
    conv.appendChild(row);
    scrollChatToBottom();
    return row;
}

function removeTypingIndicator(row) {
    if (row && row.parentNode) row.parentNode.removeChild(row);
}

// Backward-compatible helper (used by the legacy text path)
function updateConversationDisplay(userInput, aiResponse) {
    if (userInput) addUserMessage(userInput);
    if (aiResponse) addAIMessage(aiResponse);
}

// Function to speak the AI response
function speakAIResponse(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.4;
    utterance.onend = function () {
        // Resume listening only after the AI has finished speaking.
        if (isVoiceChatting && recognition) {
            try { recognition.start(); } catch (_) { /* already started */ }
        }
    };
    synth.speak(utterance);
}

// Function to handle text-based input from user
async function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    if (!userInput) return;

    // sendMessageToAI() already adds the user input to conversationHistory,
    // so we don't push it here (avoids duplicating every message).
    sendMessageToAI(userInput);
    document.getElementById('user-input').value = '';
}


