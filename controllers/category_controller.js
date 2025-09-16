const db = require('../services/db');

exports.getCategories = async (req, res) => {
    try {
        const query = 'SELECT * FROM categories';
        const { rows } = await db.pool.query(query, values);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Categories not found' });
        }
        return res.status(200).json({ 
            categories: rows
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}