const db = require('../services/db');

exports.getActiveTrainers = async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT
                t.id AS trainer_id,
                u.firstname,
                u.lastname,
                u.email,
                u.phone,
                t.specialization,
                t.bio,
                t.rating,
                t.total_reviews,
                t.avatar_url
            FROM trainers t
            JOIN users u ON t.user_id = u.id
            JOIN trainings tr ON tr.trainer_id = t.id
            WHERE tr.status = 'active'
            ORDER BY t.rating DESC, u.firstname ASC
        `;

        const result = await db.pool.query(query);

        return res.status(200).json( result.rows );
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};