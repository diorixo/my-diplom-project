class ChatWidget {
    constructor() {
        this.isOpen = false;
        this.isTyping = false;
        this.conversationHistory = [];
        this.conversationId = this.generateConversationId();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadChatHistory();
    }

    generateConversationId() {
        return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    setupEventListeners() {
        const chatButton = document.getElementById('chat-button');
        const closeButton = document.getElementById('close-chat');
        const sendButton = document.getElementById('send-message');
        const chatInput = document.getElementById('chat-input');

        chatButton.addEventListener('click', () => this.toggleChat());
        closeButton.addEventListener('click', () => this.closeChat());
        sendButton.addEventListener('click', () => this.sendMessage());
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize input
        chatInput.addEventListener('input', () => {
            this.adjustInputHeight();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    toggleChat() {
        const chatWindow = document.getElementById('chat-window');
        
        if (this.isOpen) {
            this.closeChat();
        } else {
            chatWindow.classList.remove('hidden');
            this.isOpen = true;
            this.focusInput();
            this.trackEvent('chat_opened');
        }
    }

    closeChat() {
        const chatWindow = document.getElementById('chat-window');
        chatWindow.classList.add('hidden');
        this.isOpen = false;
        this.trackEvent('chat_closed');
    }

    focusInput() {
        setTimeout(() => {
            const input = document.getElementById('chat-input');
            if (input) {
                input.focus();
            }
        }, 300);
    }

    adjustInputHeight() {
        const input = document.getElementById('chat-input');
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    }

    handleResize() {
        if (this.isOpen && window.innerWidth <= 480) {
            // Adjust for mobile
            const chatWindow = document.getElementById('chat-window');
            chatWindow.style.height = window.innerHeight + 'px';
        }
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message || this.isTyping) return;

        // Add user message to chat
        this.addMessage('user', message);
        input.value = '';
        this.adjustInputHeight();

        // Show typing indicator
        this.showTyping();
        this.trackEvent('message_sent', { message_length: message.length });

        try {
            // Send message to AI
            const response = await this.sendToAI(message);
            this.hideTyping();
            this.addMessage('bot', response);
            this.trackEvent('message_received');
        } catch (error) {
            this.hideTyping();
            this.addMessage('bot', 'Вибачте, сталася помилка. Спробуйте пізніше.');
            console.error('Chat error:', error);
            this.trackEvent('message_error', { error: error.message });
        }
    }

    addMessage(sender, text) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');

        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        messageContent.innerHTML = this.formatMessage(text);

        const messageTime = document.createElement('div');
        messageTime.classList.add('message-time');
        messageTime.textContent = this.getCurrentTime();

        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        messagesContainer.appendChild(messageDiv);

        // Scroll to bottom with smooth animation
        this.scrollToBottom(messagesContainer);

        // Save to conversation history
        this.conversationHistory.push({
            role: sender === 'user' ? 'user' : 'assistant',
            content: text,
            timestamp: new Date().toISOString()
        });

        // Save to localStorage
        this.saveChatHistory();
    }

    formatMessage(text) {
        // Enhanced formatting for better readability
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code style="background: #f1f5f9; padding: 2px 4px; border-radius: 3px; font-size: 0.9em;">$1</code>')
            .replace(/\n/g, '<br>')
            .replace(/(\d+\.\s)/g, '<br>$1') // Format numbered lists
            .replace(/^-\s(.+)/gm, '<br>• $1'); // Format bullet points
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('uk-UA', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    scrollToBottom(container) {
        const scrollOptions = {
            top: container.scrollHeight,
            behavior: 'smooth'
        };
        container.scrollTo(scrollOptions);
    }

    showTyping() {
        this.isTyping = true;
        const typingIndicator = document.getElementById('typing-indicator');
        const sendButton = document.getElementById('send-message');
        
        if (typingIndicator) {
            typingIndicator.classList.remove('hidden');
        }
        if (sendButton) {
            sendButton.disabled = true;
        }
    }

    hideTyping() {
        this.isTyping = false;
        const typingIndicator = document.getElementById('typing-indicator');
        const sendButton = document.getElementById('send-message');
        
        if (typingIndicator) {
            typingIndicator.classList.add('hidden');
        }
        if (sendButton) {
            sendButton.disabled = false;
        }
    }

    async sendToAI(message) {
        // Підготовка системного промпту з інформацією про спортивний центр
        const systemPrompt = `Ти AI-помічник спортивного центру реабілітації. 
        
        Твоя мета - допомагати клієнтам з:
        - Інформацією про тренування та заняття
        - Записом на тренування
        - Інформацією про тренерів
        - Відповідями на питання про послуги центру
        - Порадами з реабілітації та фітнесу
        
        Доступні категорії тренувань:
        - Тренажерний зал
        - Кардіо
        - Йога
        - Пілатес
        - Кросфіт
        - Бокс
        - Плавання
        
        Відповідай українською мовою, будь дружнім та професійним. Якщо не знаєш відповіді на конкретне питання, запропонуй клієнту зв'язатися з адміністрацією.`;

        // Підготовка повідомлень для API
        const messages = [
            {
                role: 'system',
                content: systemPrompt
            },
            ...this.conversationHistory.slice(-10), // Останні 10 повідомлень для контексту
            {
                role: 'user',
                content: message
            }
        ];

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                messages,
                conversation_id: this.conversationId 
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to get AI response');
        }

        const data = await response.json();
        return data.message;
    }

    saveChatHistory() {
        try {
            const chatData = {
                conversationId: this.conversationId,
                history: this.conversationHistory,
                lastUpdate: new Date().toISOString()
            };
            localStorage.setItem('chatHistory', JSON.stringify(chatData));
        } catch (error) {
            console.warn('Could not save chat history:', error);
        }
    }

    loadChatHistory() {
        try {
            const saved = localStorage.getItem('chatHistory');
            if (saved) {
                const chatData = JSON.parse(saved);
                
                // Check if saved data is from today
                const lastUpdate = new Date(chatData.lastUpdate);
                const today = new Date();
                const isToday = lastUpdate.toDateString() === today.toDateString();
                
                if (isToday && chatData.history) {
                    this.conversationHistory = chatData.history;
                    this.conversationId = chatData.conversationId || this.conversationId;
                    this.restoreMessages();
                }
            }
        } catch (error) {
            console.warn('Could not load chat history:', error);
            this.conversationHistory = [];
        }
    }

    restoreMessages() {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        // Clear existing messages except welcome message
        const welcomeMessage = messagesContainer.querySelector('.message');
        messagesContainer.innerHTML = '';
        if (welcomeMessage) {
            messagesContainer.appendChild(welcomeMessage);
        }

        // Restore conversation history
        this.conversationHistory.forEach(msg => {
            if (msg.role !== 'system') {
                this.addMessageToDOM(msg.role === 'user' ? 'user' : 'bot', msg.content);
            }
        });
    }

    addMessageToDOM(sender, text) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');

        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        messageContent.innerHTML = this.formatMessage(text);

        const messageTime = document.createElement('div');
        messageTime.classList.add('message-time');
        messageTime.textContent = this.getCurrentTime();

        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        messagesContainer.appendChild(messageDiv);

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Event tracking for analytics
    trackEvent(eventName, data = {}) {
        try {
            // You can integrate with Google Analytics, Mixpanel, etc.
            console.log('Chat Event:', eventName, data);
            
            // Example: Send to your analytics service
            // gtag('event', eventName, {
            //     event_category: 'chat',
            //     ...data
            // });
        } catch (error) {
            console.warn('Analytics tracking error:', error);
        }
    }

    // Feedback system
    async submitFeedback(rating, comment = '') {
        try {
            const response = await fetch('/api/chat/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rating,
                    comment,
                    conversation_id: this.conversationId
                })
            });

            if (response.ok) {
                this.trackEvent('feedback_submitted', { rating, has_comment: !!comment });
                return true;
            }
        } catch (error) {
            console.error('Feedback submission error:', error);
        }
        return false;
    }

    // Метод для очищення історії чату
    clearHistory() {
        this.conversationHistory = [];
        this.conversationId = this.generateConversationId();
        localStorage.removeItem('chatHistory');
        
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            const welcomeMessage = messagesContainer.querySelector('.message');
            messagesContainer.innerHTML = '';
            if (welcomeMessage) {
                messagesContainer.appendChild(welcomeMessage);
            }
        }
        
        this.trackEvent('history_cleared');
    }

    // Метод для показу статусу підключення
    updateConnectionStatus(isOnline) {
        const statusElement = document.querySelector('.status');
        if (statusElement) {
            statusElement.className = isOnline ? 'status online' : 'status offline';
            statusElement.textContent = isOnline ? 'В мережі' : 'Офлайн';
        }
    }
}

// Перевірка підключення до інтернету
function checkConnection() {
    return navigator.onLine;
}

// Ініціалізація чат-віджета при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    const chatWidget = new ChatWidget();
    
    // Monitor connection status
    window.addEventListener('online', () => {
        chatWidget.updateConnectionStatus(true);
    });
    
    window.addEventListener('offline', () => {
        chatWidget.updateConnectionStatus(false);
    });
    
    // Set initial connection status
    chatWidget.updateConnectionStatus(checkConnection());
    
    // Make chat widget globally accessible
    window.chatWidget = chatWidget;
});

// Експорт для можливого використання в інших частинах додатку
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatWidget;
}