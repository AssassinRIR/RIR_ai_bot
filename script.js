document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    let thinkingMessageElement = null; // To hold the "Thinking..." message element

    function addMessage(text, sender, isThinking = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
        
        const p = document.createElement('p');
        p.textContent = text;
        messageDiv.appendChild(p);

        if (isThinking) {
            messageDiv.classList.add('thinking'); // Add class for styling "thinking..."
            thinkingMessageElement = messageDiv; // Store reference
        } else if (thinkingMessageElement) {
            // If a real message comes, remove the "thinking" one if it's still there
            // This might not be strictly necessary if updateThinkingMessage is always called
            // but good as a fallback.
            if (chatBox.contains(thinkingMessageElement)) {
                chatBox.removeChild(thinkingMessageElement);
            }
            thinkingMessageElement = null;
        }
        
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        return messageDiv; // Return the element for potential modification (like updating "Thinking...")
    }

    function updateThinkingMessage(newText) {
        if (thinkingMessageElement) {
            thinkingMessageElement.querySelector('p').textContent = newText;
            thinkingMessageElement.classList.remove('thinking'); // Remove thinking animation
            chatBox.scrollTop = chatBox.scrollHeight;
        }
        thinkingMessageElement = null; // Clear reference
    }


    async function getBotResponse(userText) {
        // Add a "Bot is thinking..." message
        addMessage("Thinking", 'bot', true);
        sendBtn.disabled = true;
        userInput.disabled = true;

        try {
            // The path to your Netlify Function
            // Netlify automatically maps /netlify/functions/your-function-name to the endpoint
            const response = await fetch('/.netlify/functions/get-ai-response', {
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
            updateThinkingMessage(data.reply); // Update the "Thinking..." message with the actual reply

        } catch (error) {
            console.error("Error fetching AI response:", error);
            updateThinkingMessage("Sorry, I encountered an error. Please try again.");
        } finally {
            sendBtn.disabled = false;
            userInput.disabled = false;
            userInput.focus();
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
        if (event.key === 'Enter') {
            handleUserMessage();
        }
    });
});