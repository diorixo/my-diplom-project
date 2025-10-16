const express = require('express');
const router = express.Router();
const db = require('../services/db');
const authFunctions = require('../services/session');

// Middleware для перевірки прав адміністратора
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.userRole === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
};

// GET /api/admin/users - Отримати всіх користувачів
router.get('/api/admin/users', authFunctions.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const query = `
            SELECT 
                id, 
                firstname, 
                lastname, 
                email, 
                role, 
                created_at,
                updated_at
            FROM users
            ORDER BY created_at DESC
        `;

        const result = await db.pool.query(query);

        res.json({
            success: true,
            users: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            error: 'Failed to fetch users',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/admin/users/:id - Отримати конкретного користувача
router.get('/api/admin/users/:id', authFunctions.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                id, 
                firstname, 
                lastname, 
                email, 
                role, 
                created_at,
                updated_at
            FROM users
            WHERE id = $1
        `;

        const result = await db.pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ 
            error: 'Failed to fetch user',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// PUT /api/admin/users/:id/role - Змінити роль користувача
router.put('/api/admin/users/:id/role', authFunctions.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Валідація ролі
        const validRoles = ['user', 'trainer', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ 
                error: 'Invalid role. Must be one of: user, trainer, admin' 
            });
        }

        // Перевірка чи існує користувач
        const checkQuery = 'SELECT id, role FROM users WHERE id = $1';
        const checkResult = await db.pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const oldRole = checkResult.rows[0].role;

        // Якщо роль змінюється на trainer, потрібно створити запис у таблиці trainers
        if (role === 'trainer' && oldRole !== 'trainer') {
            // Перевіряємо чи вже існує запис
            const trainerCheckQuery = 'SELECT id FROM trainers WHERE user_id = $1';
            const trainerCheck = await db.pool.query(trainerCheckQuery, [id]);

            if (trainerCheck.rows.length === 0) {
                const insertTrainerQuery = `
                    INSERT INTO trainers (user_id, specialization, bio, rating, total_reviews)
                    VALUES ($1, 'Не вказано', '', 5.0, 0)
                `;
                await db.pool.query(insertTrainerQuery, [id]);
            }
        }

        // Оновлюємо роль
        const updateQuery = `
            UPDATE users 
            SET role = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, firstname, lastname, email, role, updated_at
        `;

        const result = await db.pool.query(updateQuery, [role, id]);

        console.log(`✅ User role changed: User ID ${id}, ${oldRole} -> ${role}`);

        res.json({
            success: true,
            message: 'User role updated successfully',
            user: result.rows[0],
            oldRole: oldRole,
            newRole: role
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ 
            error: 'Failed to update user role',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/admin/users/stats/summary - Статистика користувачів
router.get('/api/admin/users/stats/summary', authFunctions.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const query = `
            SELECT 
                COUNT(*) FILTER (WHERE role = 'user') as total_users,
                COUNT(*) FILTER (WHERE role = 'trainer') as total_trainers,
                COUNT(*) FILTER (WHERE role = 'admin') as total_admins,
                COUNT(*) as total_all,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_this_week,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_this_month
            FROM users
        `;

        const result = await db.pool.query(query);

        res.json({
            success: true,
            stats: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ 
            error: 'Failed to fetch user statistics',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// DELETE /api/admin/users/:id - Видалити користувача (опціонально)
router.delete('/api/admin/users/:id', authFunctions.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Перевіряємо чи не видаляє адмін сам себе
        if (parseInt(id) === req.user.userId) {
            return res.status(400).json({ 
                error: 'You cannot delete your own account' 
            });
        }

        // Перевірка чи існує користувач
        const checkQuery = 'SELECT id, role FROM users WHERE id = $1';
        const checkResult = await db.pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Видаляємо користувача (каскадне видалення налаштовано в БД)
        const deleteQuery = 'DELETE FROM users WHERE id = $1';
        await db.pool.query(deleteQuery, [id]);

        console.log(`🗑️ User deleted: User ID ${id}`);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            error: 'Failed to delete user',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;