// services/chat_analytics.js
const db = require('./db');

class ChatAnalytics {
    constructor() {
        this.sessions = new Map(); // Кеш активних сесій
        this.initializeCache();
    }

    // Ініціалізація кешу при старті
    async initializeCache() {
        try {
            // Завантажуємо активні сесії в кеш (тільки ті що реально активні зараз)
            const result = await db.pool.query(`
                SELECT * FROM chat_sessions 
                WHERE status = 'active' 
                AND last_activity > NOW() - INTERVAL '5 minutes'
            `);
            
            result.rows.forEach(session => {
                this.sessions.set(session.conversation_id, {
                    conversationId: session.conversation_id,
                    startTime: session.start_time,
                    lastActivity: session.last_activity,
                    messageCount: session.message_count,
                    userAgent: session.user_agent,
                    ipAddress: session.ip_address,
                    status: session.status
                });
            });
            
            console.log(`📊 Chat Analytics: Loaded ${this.sessions.size} active sessions`);
        } catch (error) {
            console.error('Error initializing cache:', error);
        }
    }

    // Розпочати нову сесію
    async startSession(conversationId, userAgent, ipAddress) {
        try {
            if (!this.sessions.has(conversationId)) {
                const session = {
                    conversationId,
                    startTime: new Date(),
                    lastActivity: new Date(),
                    messageCount: 0,
                    userAgent,
                    ipAddress,
                    status: 'active'
                };
                
                this.sessions.set(conversationId, session);
                
                // Зберігаємо в БД
                await db.pool.query(`
                    INSERT INTO chat_sessions 
                    (conversation_id, start_time, last_activity, user_agent, ip_address, status)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (conversation_id) DO NOTHING
                `, [conversationId, session.startTime, session.lastActivity, userAgent, ipAddress, 'active']);
                
                console.log(`📊 New chat session started: ${conversationId}`);
            }
        } catch (error) {
            console.error('Error starting session:', error);
        }
    }

    // Логування повідомлення
    async logMessage(conversationId, messageType, content, responseSource = null) {
        try {
            const timestamp = new Date();
            
            // Зберігаємо в БД
            await db.pool.query(`
                INSERT INTO chat_messages 
                (conversation_id, message_type, content, response_source, timestamp)
                VALUES ($1, $2, $3, $4, $5)
            `, [conversationId, messageType, content.substring(0, 500), responseSource, timestamp]);

            // Оновлюємо сесію
            if (this.sessions.has(conversationId)) {
                const session = this.sessions.get(conversationId);
                session.messageCount++;
                session.lastActivity = timestamp;
                
                await db.pool.query(`
                    UPDATE chat_sessions 
                    SET message_count = message_count + 1, last_activity = $1
                    WHERE conversation_id = $2
                `, [timestamp, conversationId]);
            }
        } catch (error) {
            console.error('Error logging message:', error);
        }
    }

    // Логування відгуку
    async logFeedback(conversationId, isLike, comment, messageSource) {
        try {
            const timestamp = new Date();
            
            await db.pool.query(`
                INSERT INTO chat_feedback 
                (conversation_id, is_like, comment, message_source, timestamp)
                VALUES ($1, $2, $3, $4, $5)
            `, [conversationId, isLike, comment ? comment.substring(0, 500) : null, messageSource, timestamp]);
        } catch (error) {
            console.error('Error logging feedback:', error);
        }
    }

    // Завершити сесію
    async endSession(conversationId) {
        try {
            if (this.sessions.has(conversationId)) {
                const session = this.sessions.get(conversationId);
                const endTime = new Date();
                const duration = endTime - session.startTime;
                
                await db.pool.query(`
                    UPDATE chat_sessions 
                    SET status = 'ended', end_time = $1, duration = $2
                    WHERE conversation_id = $3
                `, [endTime, duration, conversationId]);
                
                this.sessions.delete(conversationId);
                console.log(`📊 Session ended: ${conversationId} (${session.messageCount} messages)`);
            }
        } catch (error) {
            console.error('Error ending session:', error);
        }
    }

    // Отримати активні сесії
    getActiveSessions() {
        const now = new Date();
        const activeTimeout = 5 * 60 * 1000; // 5 хвилин

        return Array.from(this.sessions.values()).filter(session => {
            return session.status === 'active' && 
                   (now - session.lastActivity) < activeTimeout;
        });
    }

    // Статистика за сьогодні
    async getTodayStats() {
        try {
            const now = new Date();
            const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

            const [sessionsResult, messagesResult, feedbackResult] = await Promise.all([
                db.pool.query('SELECT COUNT(*) FROM chat_sessions WHERE start_time >= $1', [todayUTC]),
                db.pool.query(`
                    SELECT 
                        COUNT(*) FILTER (WHERE message_type = 'user') as total,
                        COUNT(*) FILTER (WHERE message_type = 'bot' AND response_source = 'faq') as faq_count,
                        COUNT(*) FILTER (WHERE message_type = 'bot' AND response_source = 'ai') as ai_count
                    FROM chat_messages 
                    WHERE timestamp >= $1
                `, [todayUTC]),
                db.pool.query(`
                    SELECT 
                        COUNT(*) FILTER (WHERE is_like = true) as likes,
                        COUNT(*) FILTER (WHERE is_like = false) as dislikes
                    FROM chat_feedback 
                    WHERE timestamp >= $1
                `, [todayUTC])
            ]);

            const likes = parseInt(feedbackResult.rows[0].likes) || 0;
            const dislikes = parseInt(feedbackResult.rows[0].dislikes) || 0;
            const totalFeedback = likes + dislikes;
            const satisfactionRate = totalFeedback > 0 ? Math.round((likes / totalFeedback) * 100) : 0;

            return {
                totalSessions: parseInt(sessionsResult.rows[0].count) || 0,
                totalMessages: parseInt(messagesResult.rows[0].total) || 0,
                likes,
                dislikes,
                satisfactionRate,
                responseSourceDistribution: {
                    faq: parseInt(messagesResult.rows[0].faq_count) || 0,
                    ai: parseInt(messagesResult.rows[0].ai_count) || 0
                }
            };
        } catch (error) {
            console.error('Error getting today stats:', error);
            return this.getEmptyStats();
        }
    }

    // Статистика за тиждень
    async getWeeklyStats() {
        try {
            const now = new Date();
            const weekAgoUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7, 0, 0, 0, 0));

            const [sessionsResult, messagesResult, feedbackResult] = await Promise.all([
                db.pool.query('SELECT COUNT(*) FROM chat_sessions WHERE start_time >= $1', [weekAgoUTC]),
                db.pool.query('SELECT COUNT(*) FROM chat_messages WHERE timestamp >= $1 AND message_type = \'user\'', [weekAgoUTC]),
                db.pool.query(`
                    SELECT 
                        COUNT(*) FILTER (WHERE is_like = true) as likes,
                        COUNT(*) FILTER (WHERE is_like = false) as dislikes
                    FROM chat_feedback 
                    WHERE timestamp >= $1
                `, [weekAgoUTC])
            ]);

            const likes = parseInt(feedbackResult.rows[0].likes) || 0;
            const dislikes = parseInt(feedbackResult.rows[0].dislikes) || 0;
            const totalFeedback = likes + dislikes;
            const satisfactionRate = totalFeedback > 0 ? Math.round((likes / totalFeedback) * 100) : 0;

            const dailyStats = await this.getDailyBreakdown(7);

            return {
                totalSessions: parseInt(sessionsResult.rows[0].count) || 0,
                totalMessages: parseInt(messagesResult.rows[0].count) || 0,
                likes,
                dislikes,
                satisfactionRate,
                dailyStats
            };
        } catch (error) {
            console.error('Error getting weekly stats:', error);
            return this.getEmptyStats();
        }
    }

    // Статистика за місяць
    async getMonthlyStats() {
        try {
            const now = new Date();
            const monthAgoUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30, 0, 0, 0, 0));

            const [sessionsResult, messagesResult, feedbackResult] = await Promise.all([
                db.pool.query('SELECT COUNT(*) FROM chat_sessions WHERE start_time >= $1', [monthAgoUTC]),
                db.pool.query('SELECT COUNT(*) FROM chat_messages WHERE timestamp >= $1 AND message_type = \'user\'', [monthAgoUTC]),
                db.pool.query(`
                    SELECT 
                        COUNT(*) FILTER (WHERE is_like = true) as likes,
                        COUNT(*) FILTER (WHERE is_like = false) as dislikes
                    FROM chat_feedback 
                    WHERE timestamp >= $1
                `, [monthAgoUTC])
            ]);

            const likes = parseInt(feedbackResult.rows[0].likes) || 0;
            const dislikes = parseInt(feedbackResult.rows[0].dislikes) || 0;
            const totalFeedback = likes + dislikes;
            const satisfactionRate = totalFeedback > 0 ? Math.round((likes / totalFeedback) * 100) : 0;

            const dailyStats = await this.getDailyBreakdown(30);

            return {
                totalSessions: parseInt(sessionsResult.rows[0].count) || 0,
                totalMessages: parseInt(messagesResult.rows[0].count) || 0,
                likes,
                dislikes,
                satisfactionRate,
                dailyStats
            };
        } catch (error) {
            console.error('Error getting monthly stats:', error);
            return this.getEmptyStats();
        }
    }

    // Розбивка по днях
    async getDailyBreakdown(days) {
        try {
            const result = [];
            const now = new Date();
            const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(todayUTC);
                date.setUTCDate(date.getUTCDate() - i);
                
                const nextDate = new Date(date);
                nextDate.setUTCDate(nextDate.getUTCDate() + 1);

                const [sessionsResult, messagesResult, feedbackResult] = await Promise.all([
                    db.pool.query(`
                        SELECT COUNT(*) FROM chat_sessions 
                        WHERE start_time >= $1 AND start_time < $2
                    `, [date, nextDate]),
                    db.pool.query(`
                        SELECT 
                            COUNT(*) FILTER (WHERE message_type = 'user') as total,
                            COUNT(*) FILTER (WHERE response_source = 'faq') as faq_count,
                            COUNT(*) FILTER (WHERE response_source = 'ai') as ai_count
                        FROM chat_messages 
                        WHERE timestamp >= $1 AND timestamp < $2
                    `, [date, nextDate]),
                    db.pool.query(`
                        SELECT 
                            COUNT(*) FILTER (WHERE is_like = true) as likes,
                            COUNT(*) FILTER (WHERE is_like = false) as dislikes
                        FROM chat_feedback 
                        WHERE timestamp >= $1 AND timestamp < $2
                    `, [date, nextDate])
                ]);

                result.push({
                    date: date.toISOString().split('T')[0],
                    totalSessions: parseInt(sessionsResult.rows[0].count) || 0,
                    totalMessages: parseInt(messagesResult.rows[0].total) || 0,
                    likes: parseInt(feedbackResult.rows[0].likes) || 0,
                    dislikes: parseInt(feedbackResult.rows[0].dislikes) || 0,
                    responseSourceDistribution: {
                        faq: parseInt(messagesResult.rows[0].faq_count) || 0,
                        ai: parseInt(messagesResult.rows[0].ai_count) || 0
                    }
                });
            }

            return result;
        } catch (error) {
            console.error('Error getting daily breakdown:', error);
            return [];
        }
    }

    // Популярні питання
    async getPopularQuestions(limit = 5) {
        try {
            const result = await db.pool.query(`
                SELECT 
                    content as question,
                    COUNT(*) as count
                FROM chat_messages
                WHERE message_type = 'user'
                AND timestamp >= NOW() - INTERVAL '30 days'
                GROUP BY content
                ORDER BY count DESC
                LIMIT $1
            `, [limit]);

            return result.rows;
        } catch (error) {
            console.error('Error getting popular questions:', error);
            return [];
        }
    }

    // Останні відгуки
    async getRecentFeedback(limit = 5) {
        try {
            const result = await db.pool.query(`
                SELECT 
                    is_like as "isLike",
                    comment,
                    message_source as source,
                    timestamp
                FROM chat_feedback
                ORDER BY timestamp DESC
                LIMIT $1
            `, [limit]);

            return result.rows.map(f => ({
                isLike: f.isLike,
                icon: f.isLike ? '👍' : '👎',
                comment: f.comment,
                timestamp: f.timestamp,
                source: f.source
            }));
        } catch (error) {
            console.error('Error getting recent feedback:', error);
            return [];
        }
    }

    // Інсайти та рекомендації
    async generateInsights(period = 7) {
        const insights = [];
        const stats = period === 7 ? await this.getWeeklyStats() : await this.getMonthlyStats();
        const activeSessions = this.getActiveSessions();

        if (stats.totalSessions < 10) {
            insights.push({
                type: 'warning',
                priority: 'medium',
                message: 'Низька активність чат-бота',
                action: 'Розгляньте можливість промо-акцій або покращення видимості віджету'
            });
        }

        const dailyStats = stats.dailyStats || [];
        const totalFaq = dailyStats.reduce((sum, day) => sum + (day.responseSourceDistribution?.faq || 0), 0);
        const totalAi = dailyStats.reduce((sum, day) => sum + (day.responseSourceDistribution?.ai || 0), 0);

        if (totalAi > totalFaq * 2) {
            insights.push({
                type: 'info',
                priority: 'low',
                message: 'AI відповідає частіше ніж FAQ',
                action: 'Можливо, варто розширити базу FAQ популярними питаннями'
            });
        }

        if (stats.satisfactionRate < 60) {
            insights.push({
                type: 'alert',
                priority: 'high',
                message: `Низький рівень задоволеності: ${stats.satisfactionRate}% 👎`,
                action: 'Перегляньте якість відповідей та оновіть базу знань'
            });
        } else if (stats.satisfactionRate >= 80) {
            insights.push({
                type: 'success',
                priority: 'low',
                message: `Відмінний рівень задоволеності: ${stats.satisfactionRate}% 👍`,
                action: 'Продовжуйте в тому ж дусі'
            });
        }

        if (stats.dislikes > stats.likes) {
            insights.push({
                type: 'warning',
                priority: 'high',
                message: `Більше негативних відгуків (${stats.dislikes} 👎 vs ${stats.likes} 👍)`,
                action: 'Терміново перегляньте якість відповідей бота'
            });
        }

        if (activeSessions.length > 5) {
            insights.push({
                type: 'info',
                priority: 'medium',
                message: `${activeSessions.length} активних користувачів зараз онлайн`,
                action: 'Пікова активність - відмінний час для моніторингу'
            });
        }

        return insights;
    }

    // Експорт даних
    async exportData() {
        try {
            const [sessions, messages, feedback] = await Promise.all([
                db.pool.query('SELECT * FROM chat_sessions ORDER BY start_time DESC LIMIT 1000'),
                db.pool.query('SELECT * FROM chat_messages ORDER BY timestamp DESC LIMIT 5000'),
                db.pool.query('SELECT * FROM chat_feedback ORDER BY timestamp DESC LIMIT 500')
            ]);

            return {
                sessions: sessions.rows,
                messages: messages.rows,
                feedback: feedback.rows.map(f => ({
                    ...f,
                    feedbackType: f.is_like ? 'like' : 'dislike'
                })),
                exportDate: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error exporting data:', error);
            return { sessions: [], messages: [], feedback: [], exportDate: new Date().toISOString() };
        }
    }

    // Дашборд
    async getDashboard() {
        try {
            // Спочатку отримуємо today stats
            const today = await this.getTodayStats();
            
            // Тепер решту даних паралельно
            const [popularQuestions, recentFeedback, dailyStats] = await Promise.all([
                this.getPopularQuestions(),
                this.getRecentFeedback(),
                this.getDailyBreakdown(7)
            ]);

            const activeSessions = this.getActiveSessions();

            return {
                today,
                popularQuestions,
                recentFeedback,
                activeSessions,
                dailyStats
            };
        } catch (error) {
            console.error('Error building dashboard:', error);
            return {
                today: this.getEmptyStats(),
                popularQuestions: [],
                recentFeedback: [],
                activeSessions: [],
                dailyStats: []
            };
        }
    }

    // Пуста статистика (fallback)
    getEmptyStats() {
        return {
            totalSessions: 0,
            totalMessages: 0,
            likes: 0,
            dislikes: 0,
            satisfactionRate: 0,
            responseSourceDistribution: { faq: 0, ai: 0 },
            dailyStats: []
        };
    }
}

// Створюємо синглтон
const chatAnalytics = new ChatAnalytics();

module.exports = chatAnalytics;