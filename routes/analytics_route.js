// routes/adminChatAnalytics.js
const express = require('express');
const router = express.Router();
const authFunctions = require('../services/session');
const chatAnalytics = require('../services/chat_analytics');

// Middleware для перевірки прав адміністратора
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.userRole === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
};

// GET /api/admin/chat-analytics/dashboard - Основна статистика
router.get('/api/admin/chat-analytics/dashboard', 
    authFunctions.authenticateToken, 
    requireAdmin, 
    async (req, res) => {
        try {
            const dashboard = await chatAnalytics.getDashboard();
            
            res.json({
                success: true,
                today: dashboard.today,
                popularQuestions: dashboard.popularQuestions,
                recentFeedback: dashboard.recentFeedback,
                activeSessions: dashboard.activeSessions,
                dailyStats: dashboard.dailyStats
            });
        } catch (error) {
            console.error('Error getting dashboard:', error);
            res.status(500).json({ 
                error: 'Failed to get dashboard data',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

// GET /api/admin/chat-analytics/weekly - Статистика за тиждень
router.get('/api/admin/chat-analytics/weekly', 
    authFunctions.authenticateToken, 
    requireAdmin, 
    async (req, res) => {
        try {
            const stats = await chatAnalytics.getWeeklyStats();
            const popularQuestions = await chatAnalytics.getPopularQuestions();
            const recentFeedback = await chatAnalytics.getRecentFeedback();
            
            res.json({
                success: true,
                today: stats,
                popularQuestions,
                recentFeedback,
                dailyStats: stats.dailyStats
            });
        } catch (error) {
            console.error('Error getting weekly stats:', error);
            res.status(500).json({ 
                error: 'Failed to get weekly statistics',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

// GET /api/admin/chat-analytics/monthly - Статистика за місяць
router.get('/api/admin/chat-analytics/monthly', 
    authFunctions.authenticateToken, 
    requireAdmin, 
    async (req, res) => {
        try {
            const stats = await chatAnalytics.getMonthlyStats();
            const popularQuestions = await chatAnalytics.getPopularQuestions();
            const recentFeedback = await chatAnalytics.getRecentFeedback();
            
            res.json({
                success: true,
                today: stats,
                popularQuestions,
                recentFeedback,
                dailyStats: stats.dailyStats
            });
        } catch (error) {
            console.error('Error getting monthly stats:', error);
            res.status(500).json({ 
                error: 'Failed to get monthly statistics',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

// GET /api/admin/chat-analytics/active-sessions - Активні сесії
router.get('/api/admin/chat-analytics/active-sessions', 
    authFunctions.authenticateToken, 
    requireAdmin, 
    async (req, res) => {
        try {
            const activeSessions = chatAnalytics.getActiveSessions();
            
            res.json({
                success: true,
                count: activeSessions.length,
                sessions: activeSessions
            });
        } catch (error) {
            console.error('Error getting active sessions:', error);
            res.status(500).json({ 
                error: 'Failed to get active sessions',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

// POST /api/admin/chat-analytics/insights - Генерація інсайтів
router.post('/api/admin/chat-analytics/insights', 
    authFunctions.authenticateToken, 
    requireAdmin, 
    async (req, res) => {
        try {
            const { period = 7 } = req.body;
            const insights = await chatAnalytics.generateInsights(period);
            
            res.json({
                success: true,
                insights,
                period
            });
        } catch (error) {
            console.error('Error generating insights:', error);
            res.status(500).json({ 
                error: 'Failed to generate insights',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

// GET /api/admin/chat-analytics/export - Експорт даних
router.get('/api/admin/chat-analytics/export', 
    authFunctions.authenticateToken, 
    requireAdmin, 
    async (req, res) => {
        try {
            const { format = 'json' } = req.query;
            const data = await chatAnalytics.exportData();
            
            if (format === 'json') {
                res.json({
                    success: true,
                    data
                });
            } else if (format === 'csv') {
                // Простий CSV експорт
                let csv = 'Type,Count,Details\n';
                csv += `Total Sessions,${data.sessions.length},\n`;
                csv += `Total Messages,${data.messages.length},\n`;
                csv += `Total Feedback,${data.feedback.length},\n`;
                
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=chat-analytics.csv');
                res.send(csv);
            } else {
                res.status(400).json({ error: 'Unsupported format' });
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            res.status(500).json({ 
                error: 'Failed to export data',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

// GET /api/admin/chat-analytics/popular-questions - Популярні питання
router.get('/api/admin/chat-analytics/popular-questions', 
    authFunctions.authenticateToken, 
    requireAdmin, 
    async (req, res) => {
        try {
            const { limit = 10 } = req.query;
            const questions = await chatAnalytics.getPopularQuestions(parseInt(limit));
            
            res.json({
                success: true,
                questions
            });
        } catch (error) {
            console.error('Error getting popular questions:', error);
            res.status(500).json({ 
                error: 'Failed to get popular questions',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

// GET /api/admin/chat-analytics/recent-feedback - Останні відгуки
router.get('/api/admin/chat-analytics/recent-feedback', 
    authFunctions.authenticateToken, 
    requireAdmin, 
    async (req, res) => {
        try {
            const { limit = 20 } = req.query;
            const feedback = await chatAnalytics.getRecentFeedback(parseInt(limit));
            
            res.json({
                success: true,
                feedback
            });
        } catch (error) {
            console.error('Error getting recent feedback:', error);
            res.status(500).json({ 
                error: 'Failed to get recent feedback',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

module.exports = router;