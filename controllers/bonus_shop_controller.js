const db = require('../services/db');

exports.getUserBalance = async (req, res) => {
    try {
        const userId = req.user.userId;
        const query = 'SELECT balance FROM users WHERE id = $1';
        const values = [userId];
        const { rows } = await db.pool.query(query, values);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Balance not found' });
        }
        const balance = rows[0].balance;

        res.status(200).json({
            success: true,
            balance: balance
        });

    } catch (err) {
        console.error('Помилка отримання балансу:', err);
        return res.status(500).json({ success: false, message: 'Помилка отримання балансу' });
    }
}

exports.getAllProducts = async (req, res) => {
    try {
        const query = 'SELECT * FROM bonus_products WHERE is_active = true ORDER BY created_at DESC';
        const { rows } = await db.pool.query(query);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Products not found' });
        }

        res.status(200).json({
            success: true,
            rows
        });

    } catch (error) {
        console.error('Помилка отримання товарів:', error);
        return res.status(500).json({ success: false, message: error.message || 'Помилка отримання товарів' });
    }
}

exports.processPurchase = async (req, res) => {
    try {

        const userId = req.user.userId;
        const productId = req.body.productId;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'ID товару не вказано'
            });
        }

        await db.pool.query('BEGIN');

        // Отримати товар
        const query_bonus_products = 'SELECT * FROM bonus_products WHERE id = $1';
        const result_bonus_products = await db.pool.query(query_bonus_products, [productId]);
        if (result_bonus_products.rows.length === 0) throw new Error('Товар не знайдено');

        // Отримати баланс користувача
        const query_user = 'SELECT balance FROM users WHERE id = $1';
        const result_user = await db.pool.query(query_user, [userId]);
        if (result_user.rows.length === 0) throw new Error('Користувача не знайдено');

        const currentBalance = result_user.rows[0].balance;
        const productPrice = result_bonus_products.rows[0].price;

        // Записати покупку
        const query_purchase = 'INSERT INTO purchases (user_id, product_id, price) VALUES ($1, $2, $3)';
        const values = [userId, productId, productPrice];
        await db.pool.query(query_purchase, values);

        await db.pool.query('COMMIT');

        res.status(200).json({
            success: true,
            message: 'Покупка успішно здійснена',
            newBalance: currentBalance - productPrice
        });

    } catch (error) {
        await db.pool.query('ROLLBACK');
        console.error('Помилка покупки:', error);
        res.status(500).json({ success: false, message: error.message || 'Помилка при покупці товару' });
    }
}