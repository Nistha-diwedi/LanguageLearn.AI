// AI API Key
const apiKey = ""; // Replace with your API key
const apiUrl = "";

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

// Function to start a conversation
async function sendMessage(userInput) {
    // Add user's input to the conversation history
    conversationHistory.push({
        "role": "user",
        "content": userInput
    });

    // Prepare the request body
    const requestBody = {
        "messages": conversationHistory,
        "model": "llama-3.1-8b-instant",  // Groq's model
        "temperature": 1,
        "max_tokens": 1024
    };

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`  // Your API key here
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // Display and optionally speak the AI response
        updateConversationDisplay(userInput, aiResponse);
        speakAIResponse(aiResponse);  // Voice response if needed

        // Add AI's response to the conversation history
        conversationHistory.push({
            "role": "assistant",
            "content": aiResponse
        });
    } catch (error) {
        console.error("Error communicating with the API:", error);
    }
}

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
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
const synth = window.speechSynthesis;
let isVoiceChatting = false;

// Function to start voice chat
function startVoiceChat() {
    isVoiceChatting = true;
    recognition.start();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.onresult = handleVoiceInput;
}

// Function to stop voice chat
function stopVoiceChat() {
    isVoiceChatting = false;
    recognition.stop();
}

// Handle voice input and send to Groq API
function handleVoiceInput(event) {
    const userVoiceInput = event.results[event.results.length - 1][0].transcript;
    if (userVoiceInput && isVoiceChatting) {
        updateConversationDisplay(userVoiceInput, "");
        sendMessageToAI(userVoiceInput);
    }
}

// Send user input to Groq API and get AI response
async function sendMessageToAI(userInput) {
    // Add user input to conversation history
    conversationHistory.push({ role: "user", content: userInput });

    const requestBody = {
        model: "llama-3.1-8b-instant",
        messages: conversationHistory,
        temperature: 1,
        max_tokens: 1024
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        let aiResponse = data.choices[0].message.content;

        // Format and display AI response
        aiResponse = formatResponse(aiResponse);
        conversationHistory.push({ role: "assistant", content: aiResponse.plainText });
        updateConversationDisplay(userInput, aiResponse.formatted);
        speakAIResponse(aiResponse.plainText);

    } catch (error) {
        console.error("Error communicating with the API:", error);
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

// Function to update the conversation display
function updateConversationDisplay(userInput, aiResponse) {
    const conversationDiv = document.getElementById('conversation');
    conversationDiv.innerHTML += `<p><strong>You:</strong> ${userInput}</p>`;
    conversationDiv.innerHTML += `<p><strong>Fluencer AI:</strong> ${aiResponse}</p>`;
    conversationDiv.scrollTop = conversationDiv.scrollHeight;
}

// Function to speak the AI response
function speakAIResponse(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.4;
    synth.speak(utterance);
    utterance.onend = function () {
        if (isVoiceChatting) {
            recognition.start();
        }
    };
}

// Function to handle text-based input from user
async function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    if (!userInput) return;

    // Add user input to conversation history
    conversationHistory.push({ role: "user", content: userInput });
    sendMessageToAI(userInput);
    document.getElementById('user-input').value = '';
}


