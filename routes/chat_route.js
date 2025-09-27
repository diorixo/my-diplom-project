// routes/chat_route.js - Покращена версія з кращими відповідями

const express = require('express');
const router = express.Router();
const db = require('../services/db');
// const fetch = require('node-fetch');

// OpenRouter API конфігурація
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'mistralai/devstral-small-2505:free';

// Функція для отримання контексту з бази даних
async function getContextInfo() {
    try {
        const categoriesQuery = 'SELECT * FROM categories ORDER BY id';
        
        const trainingsQuery = `
            SELECT 
                t.id, t.name, TO_CHAR(t.date, 'DD.MM.YYYY') as date, TO_CHAR(t.time, 'HH24:MI') as time, t.duration, t.price, 
                t.max_participants, t.current_participants, t.status,
                c.category,
                u.firstname, u.lastname
            FROM trainings t
            JOIN categories c ON t.category_id = c.id
            JOIN trainers tr ON t.trainer_id = tr.id
            JOIN users u ON tr.user_id = u.id
            WHERE t.status = 'active' AND t.date >= CURRENT_DATE
            ORDER BY t.date, t.time
            LIMIT 10
        `;
        
        const trainersQuery = `
            SELECT 
                t.id, t.specialization, t.rating, t.total_reviews, t.bio,
                u.firstname, u.lastname
            FROM trainers t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.rating DESC
            LIMIT 5
        `;

        const [categoriesResult, trainingsResult, trainersResult] = await Promise.all([
            db.pool.query(categoriesQuery),
            db.pool.query(trainingsQuery),
            db.pool.query(trainersQuery)
        ]);

        return {
            categories: categoriesResult.rows,
            upcomingTrainings: trainingsResult.rows,
            topTrainers: trainersResult.rows
        };
    } catch (error) {
        console.error('Error getting context info:', error);
        return null;
    }
}

// POST /api/chat - обробка чат повідомлень
router.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ 
                error: 'Messages array is required' 
            });
        }

        if (!OPENROUTER_API_KEY) {
            return res.status(500).json({ 
                error: 'OpenRouter API key not configured' 
            });
        }

        // Отримуємо контекст з бази даних
        const contextInfo = await getContextInfo();

        // Створюємо розширений системний промпт
        let systemPrompt = `Ти AI-помічник спортивного центру реабілітації. Твоє ім'я - Спортивний Асистент.

        ТВОЇ ОСНОВНІ ФУНКЦІЇ:
        • Надавати інформацію про тренування, розклад і ціни
        • Розповідати про наших тренерів та їх спеціалізації  
        • Пояснювати як записатися на тренування
        • Давати поради з фітнесу та реабілітації
        • Відповідати на загальні питання про центр
            
        ПРАВИЛА СПІЛКУВАННЯ:
        • Завжди відповідай українською мовою, навіть якщо користувач пише іншою мовою
        • Не переходь на російську чи англійську
        • Будь дружнім, професійним та корисним
        • Якщо клієнт хоче записатися - направляй його на сайт: "Для запису потрібно увійти в особистий кабінет на нашому сайті"
        • При незнанні точної інформації рекомендуй звернутися до адміністрації
        • Якщо користувач питає про теми, що не стосуються спортивного центру (наприклад: погода, політика, кулінарія), чемно відмовся і скажи: "Я можу допомогти тільки з питаннями про наш спортивний центр"
            
        СТИЛЬ ВІДПОВІДЕЙ:
        • Коротко та по суті, але інформативно
        • Структуруй інформацію списками коли потрібно  
        • Показуй ентузіазм до спорту та здорового способу життя`;


        // Додаємо актуальну інформацію з БД
        if (contextInfo && contextInfo.categories.length > 0) {
            systemPrompt += `\n\n📊 АКТУАЛЬНА ІНФОРМАЦІЯ З НАШОГО ЦЕНТРУ:
            🎯 ДОСТУПНІ КАТЕГОРІЇ ТРЕНУВАНЬ:
            ${contextInfo.categories.map(cat => `• ${cat.category}`).join('\n')}`;

            if (contextInfo.upcomingTrainings.length > 0) {
                systemPrompt += `\n\n📅 НАЙБЛИЖЧІ ТРЕНУВАННЯ:
                ${contextInfo.upcomingTrainings.slice(0, 5).map(training => {
                    const freePlaces = training.max_participants - training.current_participants;
                    return `• ${training.name || training.category} - ${training.date} о ${training.time}
                    Тренер: ${training.firstname} ${training.lastname}
                    Ціна: ${training.price} грн | Вільно місць: ${freePlaces}/${training.max_participants}`;
                }).join('\n')}`;
            }

            if (contextInfo.topTrainers.length > 0) {
                systemPrompt += `\n\n👨‍💼 НАШІ ТОП ТРЕНЕРИ:
                ${contextInfo.topTrainers.map(trainer => 
                    `• ${trainer.firstname} ${trainer.lastname}${trainer.specialization ? ` - ${trainer.specialization}` : ''}
                  Рейтинг: ${trainer.rating}/5.0 ⭐ (${trainer.total_reviews} відгуків)`
                ).join('\n')}`;
            }
        }

        // Оновлюємо системне повідомлення
        let updatedMessages = [...messages];
        const hasSystemMessage = messages.some(msg => msg.role === 'system');
        
        if (hasSystemMessage) {
            updatedMessages = messages.map(msg => 
                msg.role === 'system' 
                    ? { ...msg, content: systemPrompt }
                    : msg
            );
        } else {
            updatedMessages.unshift({
                role: 'system',
                content: systemPrompt
            });
        }

        // Обмежуємо кількість повідомлень
        if (updatedMessages.length > 15) {
            const systemMsg = updatedMessages.find(msg => msg.role === 'system');
            const recentMessages = updatedMessages.slice(-10);
            updatedMessages = systemMsg ? [systemMsg, ...recentMessages] : recentMessages;
        }

        // Відправляємо запит до OpenRouter API
        const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': process.env.YOUR_SITE_URL || 'http://localhost:3000',
                'X-Title': 'Sports Rehabilitation Center - AI Assistant',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: updatedMessages,
                temperature: 0.8, // Трохи більше креативності
                max_tokens: 1200, // Більше токенів для детальніших відповідей  
                top_p: 0.9,
                frequency_penalty: 0.1,
                presence_penalty: 0.1,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('OpenRouter API error:', response.status, errorData);
            throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response format from OpenRouter API');
        }

        const aiMessage = data.choices[0].message.content;

        // Логуємо використання токенів
        if (data.usage) {
            console.log('💬 Chat request completed:', {
                prompt_tokens: data.usage.prompt_tokens,
                completion_tokens: data.usage.completion_tokens,
                total_tokens: data.usage.total_tokens,
                model: MODEL
            });
        }

        res.json({ 
            message: aiMessage,
            usage: data.usage 
        });

    } catch (error) {
        console.error('Chat API error:', error);
        
        const errorMessage = error.message.includes('OpenRouter') 
            ? 'Вибачте, AI-сервіс тимчасово недоступний 🤖 Спробуйте пізніше або зверніться до адміністрації.'
            : 'Сталася технічна помилка ⚠️ Зверніться до адміністрації.';

        res.status(500).json({ 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/chat/info - інформація про чат-бота
router.get('/api/chat/info', async (req, res) => {
    try {
        let info = {
            status: 'active',
            model: MODEL,
            name: 'Спортивний Асистент 🤖',
            version: '1.0.0',
            features: [
                '📋 Консультації з тренувань',
                '👨‍💼 Інформація про тренерів', 
                '📝 Допомога з записом на заняття',
                '💪 Поради з реабілітації',
                'ℹ️ Загальна інформація про центр'
            ]
        };

        // Додаємо актуальну статистику
        try {
            const stats = await db.pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM trainings WHERE status = 'active' AND date >= CURRENT_DATE) as active_trainings,
                    (SELECT COUNT(*) FROM trainers) as total_trainers,
                    (SELECT COUNT(*) FROM categories) as categories_count,
                    (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users
            `);
            
            if (stats.rows[0]) {
                info.stats = {
                    active_trainings: parseInt(stats.rows[0].active_trainings),
                    total_trainers: parseInt(stats.rows[0].total_trainers),
                    categories_count: parseInt(stats.rows[0].categories_count),
                    total_users: parseInt(stats.rows[0].total_users)
                };
            }
        } catch (error) {
            console.error('Error getting stats:', error);
        }

        res.json(info);
    } catch (error) {
        console.error('Info API error:', error);
        res.status(500).json({ error: 'Failed to get chat info' });
    }
});

// POST /api/chat/feedback - збір відгуків
router.post('/api/chat/feedback', async (req, res) => {
    try {
        const { rating, comment, conversation_id } = req.body;
        
        console.log('📝 Chat feedback received:', { 
            rating, 
            comment: comment ? comment.substring(0, 100) + '...' : 'No comment',
            conversation_id,
            timestamp: new Date().toISOString()
        });
        
        res.json({ 
            success: true, 
            message: 'Дякуємо за відгук! 🙏 Він допоможе нам покращити сервіс.' 
        });
    } catch (error) {
        console.error('Feedback API error:', error);
        res.status(500).json({ error: 'Failed to save feedback' });
    }
});

module.exports = router;