class ChatAnalytics {
    constructor() {
        this.sessions = new Map();
        this.dailyStats = new Map();
        this.popularQuestions = new Map();
        this.userFeedback = [];
    }

    // Розпочати нову сесію
    startSession(conversationId, userAgent = '', ipAddress = '') {
        const session = {
            id: conversationId,
            startTime: new Date(),
            messageCount: 0,
            userAgent: userAgent,
            ipAddress: this.hashIP(ipAddress), // Хешуємо IP для приватності
            responses: {
                faq: 0,
                ai: 0
            },
            satisfaction: null,
            topics: new Set()
        };
        
        this.sessions.set(conversationId, session);
        return session;
    }

    // Логування повідомлення
    logMessage(conversationId, messageType, content, responseSource = 'user') {
        const session = this.sessions.get(conversationId);
        if (!session) return;

        session.messageCount++;
        
        if (messageType === 'user') {
            // Аналізуємо тематику повідомлення
            const topic = this.analyzeMessageTopic(content);
            if (topic) {
                session.topics.add(topic);
            }
            
            // Збільшуємо популярність питання
            const normalizedQuestion = this.normalizeQuestion(content);
            const count = this.popularQuestions.get(normalizedQuestion) || 0;
            this.popularQuestions.set(normalizedQuestion, count + 1);
        }
        
        if (messageType === 'bot') {
            session.responses[responseSource]++;
        }
    }

    // Логування відгуку
    logFeedback(conversationId, rating, comment = '', source = 'ai') {
        const session = this.sessions.get(conversationId);
        if (session) {
            session.satisfaction = rating;
        }
        
        this.userFeedback.push({
            conversationId,
            rating,
            comment,
            source,
            timestamp: new Date(),
            topics: session ? Array.from(session.topics) : []
        });
    }

    // Завершення сесії
    endSession(conversationId) {
        const session = this.sessions.get(conversationId);
        if (!session) return;

        session.endTime = new Date();
        session.duration = session.endTime - session.startTime;
        
        // Додаємо до денної статистики
        const today = new Date().toDateString();
        const dailyStat = this.dailyStats.get(today) || {
            totalSessions: 0,
            totalMessages: 0,
            averageDuration: 0,
            satisfactionRatings: [],
            topicDistribution: new Map(),
            sourceDistribution: { faq: 0, ai: 0 }
        };
        
        dailyStat.totalSessions++;
        dailyStat.totalMessages += session.messageCount;
        dailyStat.sourceDistribution.faq += session.responses.faq;
        dailyStat.sourceDistribution.ai += session.responses.ai;
        
        if (session.satisfaction) {
            dailyStat.satisfactionRatings.push(session.satisfaction);
        }
        
        // Додаємо теми
        session.topics.forEach(topic => {
            const count = dailyStat.topicDistribution.get(topic) || 0;
            dailyStat.topicDistribution.set(topic, count + 1);
        });
        
        this.dailyStats.set(today, dailyStat);
        this.sessions.delete(conversationId);
    }

    // Аналіз тематики повідомлення
    analyzeMessageTopic(message) {
        const lowerMessage = message.toLowerCase();
        
        const topics = {
            'розклад': ['розклад', 'коли', 'час', 'години', 'графік'],
            'ціни': ['ціна', 'вартість', 'скільки', 'коштує', 'прайс'],
            'тренери': ['тренер', 'інструктор', 'хто веде'],
            'запис': ['записатися', 'забронювати', 'реєстрація'],
            'обладнання': ['тренажер', 'інвентар', 'обладнання'],
            'здоров\'я': ['травма', 'біль', 'протипоказання', 'лікар'],
            'початківці': ['початківець', 'новачок', 'вперше', 'не займався'],
            'контакти': ['телефон', 'адреса', 'де знаходитесь', 'контакт']
        };
        
        for (const [topic, keywords] of Object.entries(topics)) {
            if (keywords.some(keyword => lowerMessage.includes(keyword))) {
                return topic;
            }
        }
        
        return 'інше';
    }

    // Нормалізація питання для аналітики
    normalizeQuestion(question) {
        return question
            .toLowerCase()
            .replace(/[?!.,]/g, '')
            .trim()
            .substring(0, 50); // Обрізаємо для зручності
    }

    // Хешування IP для приватності
    hashIP(ip) {
        if (!ip) return 'unknown';
        // Простий хеш для демо (у продакшені використовуйте crypto.createHash)
        return ip.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0).toString(16);
    }

    // Отримання статистики за день
    getDayStats(date = new Date().toDateString()) {
        const stats = this.dailyStats.get(date);
        if (!stats) return null;

        // Розрахункові метрики
        const avgDuration = stats.totalMessages > 0 
            ? Math.round(stats.totalSessions * 60000 / stats.totalMessages) // мс в хвилини
            : 0;
            
        const avgSatisfaction = stats.satisfactionRatings.length > 0
            ? stats.satisfactionRatings.reduce((a, b) => a + b, 0) / stats.satisfactionRatings.length
            : null;

        const topTopics = Array.from(stats.topicDistribution.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        return {
            date,
            totalSessions: stats.totalSessions,
            totalMessages: stats.totalMessages,
            averageMessagesPerSession: Math.round(stats.totalMessages / stats.totalSessions),
            averageDuration: avgDuration,
            averageSatisfaction: avgSatisfaction ? Math.round(avgSatisfaction * 100) / 100 : null,
            responseSourceDistribution: stats.sourceDistribution,
            topTopics: topTopics.map(([topic, count]) => ({ topic, count })),
            satisfactionDistribution: this.calculateSatisfactionDistribution(stats.satisfactionRatings)
        };
    }

    // Розрахунок розподілу задоволення
    calculateSatisfactionDistribution(ratings) {
        if (ratings.length === 0) return null;
        
        const distribution = { positive: 0, neutral: 0, negative: 0 };
        
        ratings.forEach(rating => {
            if (rating >= 4) distribution.positive++;
            else if (rating >= 3) distribution.neutral++;
            else distribution.negative++;
        });
        
        return {
            positive: Math.round(distribution.positive / ratings.length * 100),
            neutral: Math.round(distribution.neutral / ratings.length * 100),
            negative: Math.round(distribution.negative / ratings.length * 100)
        };
    }

    // Топ популярних питань
    getPopularQuestions(limit = 10) {
        return Array.from(this.popularQuestions.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([question, count]) => ({ question, count }));
    }

    // Отримання активних сесій
    getActiveSessions() {
        return Array.from(this.sessions.values()).map(session => ({
            id: session.id,
            startTime: session.startTime,
            messageCount: session.messageCount,
            topics: Array.from(session.topics),
            duration: new Date() - session.startTime
        }));
    }

    // Отримання недавніх відгуків
    getRecentFeedback(limit = 20) {
        return this.userFeedback
            .slice(-limit)
            .reverse()
            .map(feedback => ({
                rating: feedback.rating,
                comment: feedback.comment,
                source: feedback.source,
                topics: feedback.topics,
                timestamp: feedback.timestamp
            }));
    }

    // Експорт статистики для адмінпанелі
    exportStats(startDate, endDate) {
        const start = new Date(startDate).toDateString();
        const end = new Date(endDate).toDateString();
        
        const stats = [];
        let currentDate = new Date(startDate);
        
        while (currentDate.toDateString() <= end) {
            const dayStats = this.getDayStats(currentDate.toDateString());
            if (dayStats) {
                stats.push(dayStats);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return {
            period: { start, end },
            dailyStats: stats,
            popularQuestions: this.getPopularQuestions(20),
            recentFeedback: this.getRecentFeedback(50),
            summary: {
                totalSessions: stats.reduce((sum, day) => sum + day.totalSessions, 0),
                totalMessages: stats.reduce((sum, day) => sum + day.totalMessages, 0),
                averageSatisfaction: this.calculateOverallSatisfaction(stats)
            }
        };
    }

    calculateOverallSatisfaction(dailyStats) {
        const allRatings = dailyStats
            .filter(day => day.averageSatisfaction !== null)
            .map(day => day.averageSatisfaction);
            
        if (allRatings.length === 0) return null;
        
        return Math.round(
            allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length * 100
        ) / 100;
    }

    // Очищення старих даних (запускати щоденно)
    cleanOldData(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        
        // Очищуємо стару денну статистику
        for (const [dateString] of this.dailyStats.entries()) {
            if (new Date(dateString) < cutoffDate) {
                this.dailyStats.delete(dateString);
            }
        }
        
        // Очищуємо старі відгуки
        this.userFeedback = this.userFeedback.filter(
            feedback => feedback.timestamp > cutoffDate
        );
        
        console.log(`🧹 Cleaned analytics data older than ${daysToKeep} days`);
    }
}

// Глобальний інстанс аналітики
const chatAnalytics = new ChatAnalytics();

// Автоматичне очищення даних кожен день о 2:00
setInterval(() => {
    const now = new Date();
    if (now.getHours() === 2 && now.getMinutes() === 0) {
        chatAnalytics.cleanOldData();
    }
}, 60000); // Перевіряємо кожну хвилину

module.exports = chatAnalytics;