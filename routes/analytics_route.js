const express = require('express');
const router = express.Router();
const chatAnalytics = require('../services/chat_analytics');
const authFunctions = require('../services/session');

// Middleware для перевірки прав адміністратора
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.userRole === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
};

// GET /admin/chat-analytics - Головна сторінка аналітики
router.get('/admin/chat-analytics', authFunctions.authenticateToken, requireAdmin, (req, res) => {
    res.render('admin-chat-analytics', {
        title: 'Аналітика чат-бота',
        user: req.user
    });
});

// GET /api/admin/chat-analytics/dashboard - Дашборд дані
router.get('/api/admin/chat-analytics/dashboard', authFunctions.authenticateToken, requireAdmin, (req, res) => {
    try {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
        
        const todayStats = chatAnalytics.getDayStats(today) || {
            totalSessions: 0,
            totalMessages: 0,
            averageMessagesPerSession: 0,
            averageSatisfaction: null
        };
        
        const yesterdayStats = chatAnalytics.getDayStats(yesterday) || {
            totalSessions: 0,
            totalMessages: 0,
            averageMessagesPerSession: 0,
            averageSatisfaction: null
        };

        const dashboard = {
            today: todayStats,
            yesterday: yesterdayStats,
            activeSessions: chatAnalytics.getActiveSessions(),
            popularQuestions: chatAnalytics.getPopularQuestions(5),
            recentFeedback: chatAnalytics.getRecentFeedback(10),
            trends: {
                sessionsChange: calculatePercentageChange(todayStats.totalSessions, yesterdayStats.totalSessions),
                messagesChange: calculatePercentageChange(todayStats.totalMessages, yesterdayStats.totalMessages),
                satisfactionChange: calculatePercentageChange(todayStats.averageSatisfaction, yesterdayStats.averageSatisfaction)
            }
        };

        res.json(dashboard);
    } catch (error) {
        console.error('Dashboard analytics error:', error);
        res.status(500).json({ error: 'Failed to get dashboard data' });
    }
});

// GET /api/admin/chat-analytics/weekly - Тижнева статистика
router.get('/api/admin/chat-analytics/weekly', authFunctions.authenticateToken, requireAdmin, (req, res) => {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const weeklyStats = chatAnalytics.exportStats(startDate, endDate);
        
        res.json(weeklyStats);
    } catch (error) {
        console.error('Weekly analytics error:', error);
        res.status(500).json({ error: 'Failed to get weekly data' });
    }
});

// GET /api/admin/chat-analytics/monthly - Місячна статистика
router.get('/api/admin/chat-analytics/monthly', authFunctions.authenticateToken, requireAdmin, (req, res) => {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const monthlyStats = chatAnalytics.exportStats(startDate, endDate);
        
        res.json(monthlyStats);
    } catch (error) {
        console.error('Monthly analytics error:', error);
        res.status(500).json({ error: 'Failed to get monthly data' });
    }
});

// GET /api/admin/chat-analytics/export - Експорт даних
router.get('/api/admin/chat-analytics/export', authFunctions.authenticateToken, requireAdmin, (req, res) => {
    try {
        const { startDate, endDate, format = 'json' } = req.query;
        
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        
        const exportData = chatAnalytics.exportStats(start, end);
        
        if (format === 'csv') {
            // Конвертуємо в CSV формат
            const csv = convertToCSV(exportData.dailyStats);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=chat-analytics-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`);
            res.send(csv);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=chat-analytics-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.json`);
            res.json(exportData);
        }
    } catch (error) {
        console.error('Export analytics error:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

// POST /api/admin/chat-analytics/insights - Генерація інсайтів
router.post('/api/admin/chat-analytics/insights', authFunctions.authenticateToken, requireAdmin, (req, res) => {
    try {
        const { period = 7 } = req.body;
        
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - period);
        
        const stats = chatAnalytics.exportStats(startDate, endDate);
        const insights = generateInsights(stats);
        
        res.json({ insights });
    } catch (error) {
        console.error('Insights generation error:', error);
        res.status(500).json({ error: 'Failed to generate insights' });
    }
});

// Допоміжні функції
function calculatePercentageChange(current, previous) {
    if (!previous || previous === 0) {
        return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
}

function convertToCSV(dailyStats) {
    if (!dailyStats || dailyStats.length === 0) return '';
    
    const headers = ['Date', 'Sessions', 'Messages', 'Avg Messages/Session', 'Satisfaction', 'FAQ %', 'AI %'];
    const rows = dailyStats.map(day => [
        day.date,
        day.totalSessions,
        day.totalMessages,
        day.averageMessagesPerSession,
        day.averageSatisfaction || 'N/A',
        Math.round((day.responseSourceDistribution.faq / (day.responseSourceDistribution.faq + day.responseSourceDistribution.ai)) * 100) || 0,
        Math.round((day.responseSourceDistribution.ai / (day.responseSourceDistribution.faq + day.responseSourceDistribution.ai)) * 100) || 0
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateInsights(stats) {
    const insights = [];
    
    if (!stats.dailyStats || stats.dailyStats.length === 0) {
        return [{ type: 'info', message: 'Недостатньо даних для аналізу', priority: 'low' }];
    }
    
    const avgSessionsPerDay = stats.summary.totalSessions / stats.dailyStats.length;
    const avgMessagesPerDay = stats.summary.totalMessages / stats.dailyStats.length;
    
    // Аналіз активності
    if (avgSessionsPerDay > 50) {
        insights.push({
            type: 'success',
            message: `Висока активність: в середньому ${Math.round(avgSessionsPerDay)} сесій на день`,
            priority: 'high',
            action: 'Розгляньте можливість розширення FAQ бази'
        });
    } else if (avgSessionsPerDay < 10) {
        insights.push({
            type: 'warning',
            message: `Низька активність: в середньому ${Math.round(avgSessionsPerDay)} сесій на день`,
            priority: 'medium',
            action: 'Розгляньте покращення видимості чат-віджета'
        });
    }
    
    // Аналіз задоволення
    if (stats.summary.averageSatisfaction) {
        if (stats.summary.averageSatisfaction >= 4.0) {
            insights.push({
                type: 'success',
                message: `Відмінний рівень задоволення: ${stats.summary.averageSatisfaction}/5.0`,
                priority: 'high'
            });
        } else if (stats.summary.averageSatisfaction < 3.0) {
            insights.push({
                type: 'error',
                message: `Низький рівень задоволення: ${stats.summary.averageSatisfaction}/5.0`,
                priority: 'high',
                action: 'Терміново перевірте та покращте відповіді бота'
            });
        }
    }
    
    // Аналіз джерел відповідей
    const totalResponses = stats.dailyStats.reduce((sum, day) => 
        sum + day.responseSourceDistribution.faq + day.responseSourceDistribution.ai, 0);
    const faqPercentage = Math.round((stats.dailyStats.reduce((sum, day) => 
        sum + day.responseSourceDistribution.faq, 0) / totalResponses) * 100);
    
    if (faqPercentage > 70) {
        insights.push({
            type: 'info',
            message: `FAQ покриває ${faqPercentage}% запитів - ефективна база знань`,
            priority: 'medium'
        });
    } else if (faqPercentage < 40) {
        insights.push({
            type: 'warning',
            message: `FAQ покриває лише ${faqPercentage}% запитів`,
            priority: 'medium',
            action: 'Додайте більше питань до FAQ бази на основі популярних запитів'
        });
    }
    
    // Аналіз популярних тем
    const topTopics = stats.dailyStats.reduce((acc, day) => {
        day.topTopics.forEach(({ topic, count }) => {
            acc[topic] = (acc[topic] || 0) + count;
        });
        return acc;
    }, {});
    
    const mostPopularTopic = Object.entries(topTopics)
        .sort(([,a], [,b]) => b - a)[0];
    
    if (mostPopularTopic) {
        insights.push({
            type: 'info',
            message: `Найпопулярніша тема: "${mostPopularTopic[0]}" (${mostPopularTopic[1]} запитів)`,
            priority: 'low',
            action: 'Розгляньте створення детальної FAQ секції для цієї теми'
        });
    }
    
    return insights.sort((a, b) => {
        const priority = { high: 3, medium: 2, low: 1 };
        return priority[b.priority] - priority[a.priority];
    });
}

module.exports = router;