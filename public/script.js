document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const fileInput = document.getElementById('file-input');
    const chatBox = document.getElementById('chat-box');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userMessage = userInput.value.trim();
        const file = fileInput.files[0];

        if (!userMessage && !file) return;

        // Display user's message
        if (userMessage) {
            appendMessage('user', userMessage);
        }
        if (file) {
            appendMessage('user', `<i>File attached: ${file.name}</i>`);
        }
        
        // Clear inputs
        userInput.value = '';
        fileInput.value = '';

        // Show typing indicator
        const typingIndicator = showTypingIndicator();

        // Prepare data for backend
        const formData = new FormData();
        formData.append('prompt', userMessage);

        let endpoint = '/generate-text';
        if (file) {
            // Logic to determine endpoint based on file type can be added here
            // For now, defaulting to image endpoint for any file
            endpoint = '/generate-from-image';
            formData.append('image', file);
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: file ? formData : JSON.stringify({ prompt: userMessage }),
                headers: file ? {} : { 'Content-Type': 'application/json' }
            });

            // Remove typing indicator
            typingIndicator.remove();

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'An unknown error occurred');
            }

            const data = await response.json();
            appendMessage('bot', data.output);

        } catch (error) {
            console.error('Error:', error);
            // Remove typing indicator and show error message
            typingIndicator.remove();
            appendMessage('bot', `Sorry, an error occurred: ${error.message}`);
        }
    });

    function appendMessage(sender, text) {
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('message', sender);

        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        messageContent.innerHTML = text.replace(/\n/g, '<br>');

        messageWrapper.appendChild(messageContent);
        chatBox.appendChild(messageWrapper);
        scrollToBottom();
        return messageWrapper;
    }

    function showTypingIndicator() {
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('message', 'bot', 'typing');
        
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('typing-indicator');
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';

        messageContent.appendChild(typingIndicator);
        messageWrapper.appendChild(messageContent);
        chatBox.appendChild(messageWrapper);
        scrollToBottom();
        return messageWrapper;
    }

    function scrollToBottom() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});