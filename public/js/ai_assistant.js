class EnhancedChatWidget {
    constructor() {
        this.isOpen = false;
        this.isTyping = false;
        this.conversationHistory = [];
        this.conversationId = this.generateConversationId();
        this.quickReplies = [];
        this.messageCount = 0;
        this.init();
    }

    generateConversationId() {
        return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    init() {
        this.setupEventListeners();
        this.loadChatHistory();
        this.loadQuickReplies();
        this.addClearChatButton();
    }

    setupEventListeners() {
        const chatButton = document.getElementById('chat-button');
        const closeButton = document.getElementById('close-chat');
        const sendButton = document.getElementById('send-message');
        const chatInput = document.getElementById('chat-input');

        chatButton?.addEventListener('click', () => this.toggleChat());
        closeButton?.addEventListener('click', () => this.closeChat());
        sendButton?.addEventListener('click', () => this.sendMessage());
        
        chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize input
        chatInput?.addEventListener('input', () => {
            this.adjustInputHeight();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    async loadQuickReplies() {
        try {
            const response = await fetch('/api/chat/quick-replies');
            if (response.ok) {
                const data = await response.json();
                this.quickReplies = data.quickReplies || [];
            }
        } catch (error) {
            console.warn('Failed to load quick replies:', error);
        }
    }

    toggleChat() {
        const chatWindow = document.getElementById('chat-window');
        
        if (this.isOpen) {
            this.closeChat();
        } else {
            chatWindow?.classList.remove('hidden');
            this.isOpen = true;
            this.focusInput();
            this.showQuickRepliesIfNeeded();
            this.trackEvent('chat_opened');
        }
    }

    closeChat() {
        const chatWindow = document.getElementById('chat-window');
        chatWindow?.classList.add('hidden');
        this.isOpen = false;
        this.trackEvent('chat_closed');
    }

    focusInput() {
        setTimeout(() => {
            const input = document.getElementById('chat-input');
            input?.focus();
        }, 300);
    }

    adjustInputHeight() {
        const input = document.getElementById('chat-input');
        if (input) {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 100) + 'px';
        }
    }

    handleResize() {
        if (this.isOpen && window.innerWidth <= 480) {
            const chatWindow = document.getElementById('chat-window');
            if (chatWindow) {
                chatWindow.style.height = window.innerHeight + 'px';
            }
        }
    }

    showQuickRepliesIfNeeded() {
        // Показуємо швидкі відповіді тільки якщо мало повідомлень
        if (this.messageCount <= 2) {
            setTimeout(() => {
                this.showQuickReplies();
            }, 1000);
        }
    }

    showQuickReplies() {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer || messagesContainer.querySelector('.quick-replies')) return;

        if (this.quickReplies.length === 0) return;

        const quickRepliesDiv = document.createElement('div');
        quickRepliesDiv.classList.add('quick-replies');
        quickRepliesDiv.innerHTML = `
            <div class="quick-replies-title">💭 Популярні питання:</div>
            <div class="quick-replies-buttons">
                ${this.quickReplies.map(reply => 
                    `<button class="quick-reply-btn" data-question="${reply.question}" data-id="${reply.id}">
                        ${reply.text}
                    </button>`
                ).join('')}
            </div>
        `;

        messagesContainer.appendChild(quickRepliesDiv);
        this.scrollToBottom(messagesContainer);

        // Додаємо обробники подій
        quickRepliesDiv.querySelectorAll('.quick-reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const question = e.target.getAttribute('data-question');
                const id = e.target.getAttribute('data-id');
                this.handleQuickReply(question, id);
            });
        });
    }

    hideQuickReplies() {
        const quickReplies = document.querySelector('.quick-replies');
        if (quickReplies) {
            quickReplies.style.opacity = '0';
            quickReplies.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                quickReplies.remove();
            }, 300);
        }
    }

    handleQuickReply(question, id) {
        this.addMessage('user', question);
        this.hideQuickReplies();
        this.sendQuestionToAI(question, id);
        this.trackEvent('quick_reply_used', { reply_id: id, question: question });
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input?.value.trim();
        
        if (!message || this.isTyping) return;

        this.addMessage('user', message);
        input.value = '';
        this.adjustInputHeight();
        this.hideQuickReplies();

        this.showTyping();
        this.trackEvent('message_sent', { message_length: message.length });

        try {
            const response = await this.sendToAI(message);
            this.hideTyping();
            this.addMessage('bot', response.message, response.source);
            this.trackEvent('message_received', { source: response.source });
            
            // Показуємо швидкі відповіді знову якщо мало повідомлень
            if (this.messageCount < 4) {
                setTimeout(() => {
                    this.showQuickReplies();
                }, 3000);
            }
        } catch (error) {
            this.hideTyping();
            this.addMessage('bot', 'Вибачте, сталася помилка 😔 Спробуйте пізніше або зверніться до адміністрації.');
            console.error('Chat error:', error);
            this.trackEvent('message_error', { error: error.message });
        }
    }

    async sendQuestionToAI(question, replyId = null) {
        this.showTyping();

        try {
            const response = await this.sendToAI(question);
            this.hideTyping();
            this.addMessage('bot', response.message, response.source);
            
            setTimeout(() => {
                this.showQuickReplies();
            }, 5000);
            
        } catch (error) {
            this.hideTyping();
            this.addMessage('bot', 'Вибачте, сталася помилка. Спробуйте пізніше.');
            console.error('Quick reply error:', error);
        }
    }

    addMessage(sender, text, source = 'user') {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
        
        // Додаємо атрибут джерела для бот повідомлень
        if (sender === 'bot' && source) {
            messageDiv.setAttribute('data-source', source);
        }

        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        messageContent.innerHTML = this.formatMessage(text);

        const messageTime = document.createElement('div');
        messageTime.classList.add('message-time');
        messageTime.textContent = this.getCurrentTime();

        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        messagesContainer.appendChild(messageDiv);

        // Додаємо індикатор джерела для бот повідомлень
        if (sender === 'bot' && source) {
            this.addSourceIndicator(messageDiv, source);
        }

        // Додаємо кнопки фідбеку для бот повідомлень (окрім привітання)
        if (sender === 'bot' && !text.includes('Привіт! 👋')) {
            setTimeout(() => {
                this.addFeedbackButtons(messageDiv, source);
            }, 2000);
        }

        this.scrollToBottom(messagesContainer);

        // Зберігаємо в історії розмов
        this.conversationHistory.push({
            role: sender === 'user' ? 'user' : 'assistant',
            content: text,
            timestamp: new Date().toISOString(),
            source: source
        });

        this.messageCount++;
        this.saveChatHistory();
    }

    addSourceIndicator(messageElement, source) {
        const indicator = document.createElement('div');
        indicator.classList.add('source-indicator');
        
        const sourceText = source === 'faq' ? '📚 Швидка відповідь' : '🤖 AI відповідь';
        const sourceColor = source === 'faq' ? '#10b981' : '#6366f1';
        
        indicator.innerHTML = `
            <span style="color: ${sourceColor}; font-size: 11px;">${sourceText}</span>
        `;
        
        messageElement.appendChild(indicator);
    }

    addFeedbackButtons(messageElement, source) {
        if (messageElement.querySelector('.message-feedback')) return;

        const feedbackDiv = document.createElement('div');
        feedbackDiv.classList.add('message-feedback');
        feedbackDiv.innerHTML = `
            <div class="feedback-question">Чи була відповідь корисною?</div>
            <div class="feedback-buttons">
                <button class="feedback-btn positive" data-rating="positive" title="Так, корисно">
                    👍
                </button>
                <button class="feedback-btn negative" data-rating="negative" title="Ні, не корисно">
                    👎
                </button>
            </div>
        `;

        messageElement.appendChild(feedbackDiv);

        feedbackDiv.querySelectorAll('.feedback-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rating = e.target.getAttribute('data-rating');
                this.handleFeedback(rating, messageElement, feedbackDiv, source);
            });
        });
    }

    handleFeedback(rating, messageElement, feedbackDiv, source) {
        const isPositive = rating === 'positive';
        
        feedbackDiv.innerHTML = `
            <div class="feedback-thanks">
                ${isPositive ? 
                    '✅ Дякуємо за відгук!' : 
                    '📝 Дякуємо! Ми покращимо відповіді.'
                }
            </div>
        `;

        // Відправляємо фідбек на сервер
        this.submitFeedback(isPositive ? 5 : 2, '', this.conversationId, source);

        this.trackEvent('message_feedback', { 
            rating: rating,
            source: source,
            conversation_id: this.conversationId
        });

        // Автоматично прибираємо фідбек через 3 секунди
        setTimeout(() => {
            feedbackDiv.style.opacity = '0';
            setTimeout(() => {
                feedbackDiv.remove();
            }, 300);
        }, 3000);
    }

    formatMessage(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code style="background: #f1f5f9; padding: 2px 4px; border-radius: 3px; font-size: 0.9em;">$1</code>')
            .replace(/\n/g, '<br>')
            .replace(/^• (.+)/gm, '<div style="margin-left: 12px;">• $1</div>')
            .replace(/^(\d+\.\s)(.+)/gm, '<div style="margin-left: 12px;">$1$2</div>');
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('uk-UA', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    scrollToBottom(container) {
        setTimeout(() => {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }

    showTyping() {
        this.isTyping = true;
        const typingIndicator = document.getElementById('typing-indicator');
        const sendButton = document.getElementById('send-message');
        
        typingIndicator?.classList.remove('hidden');
        if (sendButton) sendButton.disabled = true;
    }

    hideTyping() {
        this.isTyping = false;
        const typingIndicator = document.getElementById('typing-indicator');
        const sendButton = document.getElementById('send-message');
        
        typingIndicator?.classList.add('hidden');
        if (sendButton) sendButton.disabled = false;
    }

    async sendToAI(message) {
        const messages = [
            {
                role: 'system',
                content: 'Ти AI-помічник спортивного центру реабілітації.'
            },
            ...this.conversationHistory.slice(-10),
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
        return {
            message: data.message,
            source: data.source || 'ai',
            usage: data.usage
        };
    }

    async submitFeedback(rating, comment = '', conversation_id, source = 'ai') {
        try {
            const response = await fetch('/api/chat/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rating,
                    comment,
                    conversation_id,
                    message_source: source
                })
            });

            if (response.ok) {
                this.trackEvent('feedback_submitted', { rating, has_comment: !!comment, source });
                return true;
            }
        } catch (error) {
            console.error('Feedback submission error:', error);
        }
        return false;
    }

    saveChatHistory() {
        try {
            const chatData = {
                conversationId: this.conversationId,
                history: this.conversationHistory,
                messageCount: this.messageCount,
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
                
                const lastUpdate = new Date(chatData.lastUpdate);
                const today = new Date();
                const isToday = lastUpdate.toDateString() === today.toDateString();
                
                if (isToday && chatData.history) {
                    this.conversationHistory = chatData.history;
                    this.conversationId = chatData.conversationId || this.conversationId;
                    this.messageCount = chatData.messageCount || 0;
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

        const welcomeMessage = messagesContainer.querySelector('.message');
        messagesContainer.innerHTML = '';
        if (welcomeMessage) {
            messagesContainer.appendChild(welcomeMessage);
        }

        this.conversationHistory.forEach(msg => {
            if (msg.role !== 'system') {
                this.addMessageToDOM(msg.role === 'user' ? 'user' : 'bot', msg.content, msg.source);
            }
        });
    }

    addMessageToDOM(sender, text, source) {
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

        if (sender === 'bot' && source) {
            this.addSourceIndicator(messageDiv, source);
        }

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    trackEvent(eventName, data = {}) {
        try {
            console.log('📊 Chat Event:', eventName, data);
        } catch (error) {
            console.warn('Analytics tracking error:', error);
        }
    }

    clearHistory() {
        this.conversationHistory = [];
        this.conversationId = this.generateConversationId();
        this.messageCount = 0;
        localStorage.removeItem('chatHistory');
        
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            const welcomeMessage = messagesContainer.querySelector('.message');
            messagesContainer.innerHTML = '';
            if (welcomeMessage) {
                messagesContainer.appendChild(welcomeMessage);
            }
        }
        
        setTimeout(() => {
            this.showQuickReplies();
        }, 500);
        
        this.trackEvent('history_cleared');
    }

    addClearChatButton() {
        const chatHeader = document.querySelector('.chat-header');
        if (!chatHeader || chatHeader.querySelector('.clear-chat-btn')) return;

        const clearBtn = document.createElement('button');
        clearBtn.classList.add('clear-chat-btn');
        clearBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        clearBtn.title = 'Очистити чат';
        
        const closeBtn = chatHeader.querySelector('.close-button');
        chatHeader.insertBefore(clearBtn, closeBtn);

        clearBtn.addEventListener('click', () => {
            if (confirm('Очистити історію чату?')) {
                this.clearHistory();
            }
        });
    }

    updateConnectionStatus(isOnline) {
        const statusElement = document.querySelector('.status');
        if (statusElement) {
            statusElement.className = isOnline ? 'status online' : 'status offline';
            statusElement.textContent = isOnline ? 'В мережі' : 'Офлайн';
        }
    }
}

// Ініціалізація покращеного віджета
document.addEventListener('DOMContentLoaded', () => {
    const chatWidget = new EnhancedChatWidget();
    
    // Monitor connection status
    window.addEventListener('online', () => {
        chatWidget.updateConnectionStatus(true);
    });
    
    window.addEventListener('offline', () => {
        chatWidget.updateConnectionStatus(false);
    });
    
    chatWidget.updateConnectionStatus(navigator.onLine);
    window.chatWidget = chatWidget;
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedChatWidget;
}