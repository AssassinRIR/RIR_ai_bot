document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    let thinkingMessageElement = null;

    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const closeBtn = document.getElementById('close-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const voiceBtn = document.getElementById('voice-btn');
    const fileInput = document.getElementById('file-input');
    const chatContainer = document.getElementById('chat-container');

    function addMessage(text, sender, isThinking = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
        const p = document.createElement('p');
        p.textContent = text;
        messageDiv.appendChild(p);

        if (isThinking) {
            messageDiv.classList.add('thinking');
            thinkingMessageElement = messageDiv;
        } else if (thinkingMessageElement && chatBox.contains(thinkingMessageElement)) {
            chatBox.removeChild(thinkingMessageElement);
            thinkingMessageElement = null;
        }

        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        return messageDiv;
    }

    function updateThinkingMessage(newText) {
        if (thinkingMessageElement) {
            thinkingMessageElement.querySelector('p').textContent = newText;
            thinkingMessageElement.classList.remove('thinking');
            chatBox.scrollTop = chatBox.scrollHeight;
            thinkingMessageElement = null;
        }
    }

    async function getBotResponse(userText) {
        addMessage("Thinking...", 'bot', true);
        sendBtn.disabled = true;
        userInput.disabled = true;
        window.dispatchEvent(new CustomEvent('solarSystemSpeed', { detail: { fast: true } }));

        try {
            const response = await fetch('/.netlify/functions/gemini-handler', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: userText }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `API Error: ${response.status}`);
            }

            const data = await response.json();
            updateThinkingMessage(data.reply);

        } catch (error) {
            console.error("Error fetching AI response:", error);
            updateThinkingMessage("Sorry, I encountered an error. Please try again.");
        } finally {
            sendBtn.disabled = false;
            userInput.disabled = false;
            userInput.focus();
            window.dispatchEvent(new CustomEvent('solarSystemSpeed', { detail: { fast: false } }));
        }
    }

    function handleUserMessage() {
        const userText = userInput.value.trim();
        if (userText === "") return;
        addMessage(userText, 'user');
        userInput.value = "";
        getBotResponse(userText);
    }

    sendBtn.addEventListener('click', handleUserMessage);
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') handleUserMessage();
    });

    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            chatContainer.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });

    deleteBtn.addEventListener('click', () => {
        chatBox.innerHTML = '';
    });

    closeBtn.addEventListener('click', () => {
        chatContainer.classList.add('closed');
    });

    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            addMessage(`Uploaded file: ${e.target.files[0].name}`, 'user');
        }
    });

    let recognizing = false;
    let recognition;
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            addMessage(transcript, 'user');
            getBotResponse(transcript);
        };
        recognition.onerror = function(event) {
            addMessage('Voice recognition error', 'bot');
        };
        recognition.onend = function() {
            recognizing = false;
            voiceBtn.textContent = '🎤';
        };
    }

    voiceBtn.addEventListener('click', () => {
        if (!recognizing && recognition) {
            recognition.start();
            recognizing = true;
            voiceBtn.textContent = '🛑';
        } else if (recognizing && recognition) {
            recognition.stop();
            recognizing = false;
            voiceBtn.textContent = '🎤';
        } else {
            addMessage('Voice recognition not supported in this browser.', 'bot');
        }
    });
});
