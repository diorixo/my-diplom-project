const db = require('../services/db');

exports.getTrainerData = async (req, res) => {
    try {
        const userId = req.user.userId;
        const query = `
            SELECT 
                u.id as user_id,
                u.username,
                u.firstname,
                u.lastname,
                u.gender,
                u.email,
                u.phone,
                TO_CHAR(u.created_at, \'DD.MM.YYYY\') AS created_date,
                t.id as trainer_id,
                t.specialization,
                t.bio,
                t.rating,
                t.total_reviews
            FROM users u
            JOIN trainers t ON u.id = t.user_id
            WHERE u.id = $1 AND u.role = 'trainer'
        `;
        const values = [userId];
        const { rows } = await db.pool.query(query, values);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Trainer not found' });
        }
        const trainer = rows[0];
        return res.status(200).json({ 
            userId: trainer.user_id, 
            username: trainer.username,
            firstName: trainer.firstname,
            lastName: trainer.lastname,
            gender: trainer.gender,
            email: trainer.email,
            phone: trainer.phone,
            created_at: trainer.created_date,
            trainerId: trainer.trainer_id,
            specialization: trainer.specialization,
            bio: trainer.bio,
            rating: trainer.rating,
            totalReviews: trainer.total_reviews,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

exports.updateTrainer = async (req, res) => {
    try {
        const { firstName, lastName, username, gender, email, phone, specialization, bio } = req.body;
        const userId = req.user.userId;

        // Оновлення таблиці users
        const queryUser = `UPDATE users SET firstName = $1, lastName = $2, username = $3, gender = $4, email = $5, phone = $6 WHERE id = $7`;
        const valuesUser = [firstName, lastName, username, gender, email, phone, userId];
        await db.pool.query(queryUser, valuesUser);

        // Оновлення таблиці trainers
        const queryTrainer = `UPDATE trainers SET specialization = $1, bio = $2 WHERE user_id = $3`;
        const valuesTrainer = [specialization, bio, userId];
        await db.pool.query(queryTrainer, valuesTrainer);

        res.json({ 
            success: true, 
            message: 'Профіль успішно оновлено' 
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Помилка оновлення профілю' 
        });
    }
};
