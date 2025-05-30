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

  function addCopyButtonsToCodeBlocks(containerElement) {
    const preElements = containerElement.querySelectorAll('pre');
    preElements.forEach(pre => {
        if (pre.querySelector('.copy-btn')) return;

        const codeElement = pre.querySelector('code');
        const codeToCopy = codeElement ? codeElement.innerText : pre.innerText;

        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.textContent = 'Copy';
        btn.setAttribute('aria-label', 'Copy code to clipboard');
        btn.onclick = (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(codeToCopy).then(() => {
                btn.textContent = 'Copied!';
                btn.disabled = true;
                setTimeout(() => {
                    btn.textContent = 'Copy';
                    btn.disabled = false;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy code: ', err);
                btn.textContent = 'Error';
                 setTimeout(() => {
                    btn.textContent = 'Copy';
                }, 2000);
            });
        };
        pre.appendChild(btn);
    });
  }

  function configureMarked() {
    if (typeof marked !== 'undefined' && typeof Prism !== 'undefined') {
        marked.setOptions({
            pedantic: false,
            gfm: true,
            breaks: true,
            smartLists: true,
            smartypants: false,
            xhtml: false,
            highlight: function (code, lang) {
                const language = (lang || 'plaintext').toLowerCase();
                if (Prism.languages[language]) {
                    return Prism.highlight(code, Prism.languages[language], language);
                }
                const escapedCode = code.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
                return `<code class="language-plaintext">${escapedCode}</code>`;
            }
        });
    }
  }

  configureMarked();

  function addMessage(text, sender, isThinking = false) {
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');

      if (sender === 'bot' && typeof marked !== 'undefined' && typeof Prism !== 'undefined') {
          messageDiv.innerHTML = marked.parse(text);

          const preElements = messageDiv.querySelectorAll('pre');
          preElements.forEach(pre => {
              if (pre.querySelector('code') && Prism.plugins && Prism.plugins.LineNumbers) {
                  pre.classList.add('line-numbers');
              }
          });
          Prism.highlightAllUnder(messageDiv);
          addCopyButtonsToCodeBlocks(messageDiv);
      } else {
          const p = document.createElement('p');
          p.textContent = text;
          messageDiv.appendChild(p);
      }

      if (isThinking) {
          messageDiv.classList.add('thinking');
          thinkingMessageElement = messageDiv;
      } else if (thinkingMessageElement && chatBox.contains(thinkingMessageElement)) {
          // This logic seems to be for replacing a "Thinking..." message that was previously added.
          // updateThinkingMessage handles the content update of the existing thinkingMessageElement.
          // So, direct removal here might be redundant if updateThinkingMessage is always called.
          // Let's assume updateThinkingMessage will update it, and it will be nulled out later.
      }

      chatBox.appendChild(messageDiv);
      chatBox.scrollTop = chatBox.scrollHeight;
      return messageDiv;
  }

  function updateThinkingMessage(newText) {
      if (thinkingMessageElement) {
          thinkingMessageElement.classList.remove('thinking');

          if (typeof marked !== 'undefined' && typeof Prism !== 'undefined') {
              thinkingMessageElement.innerHTML = marked.parse(newText);

              const preElements = thinkingMessageElement.querySelectorAll('pre');
              preElements.forEach(pre => {
                  if (pre.querySelector('code') && Prism.plugins && Prism.plugins.LineNumbers) {
                      pre.classList.add('line-numbers');
                  }
              });
              Prism.highlightAllUnder(thinkingMessageElement);
              addCopyButtonsToCodeBlocks(thinkingMessageElement);
          } else {
              thinkingMessageElement.innerHTML = '';
              const p = document.createElement('p');
              p.textContent = newText;
              thinkingMessageElement.appendChild(p);
          }
      }
  }

  async function getBotResponse(userText) {
      addMessage("Thinking...", 'bot', true);
      sendBtn.disabled = true;
      userInput.disabled = true;
      window.dispatchEvent(new CustomEvent('solarSystemSpeed', { detail: { fast: true } }));

      try {
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