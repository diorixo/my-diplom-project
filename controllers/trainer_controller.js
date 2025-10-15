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
                t.total_reviews,
                -- К-сть тренувань за місяць
                (SELECT COUNT(*) 
                    FROM trainings tr
                    WHERE tr.trainer_id = t.id
                        AND date_trunc('month', tr.date) = date_trunc('month', CURRENT_DATE)
                        AND tr.status = 'completed') AS sessions_this_month,

                -- Дохід за місяць
                (SELECT COALESCE(SUM(tr.price), 0)
                    FROM trainings tr
                    JOIN bookings b ON b.training_id = tr.id
                    WHERE tr.trainer_id = t.id
                        AND date_trunc('month', tr.date) = date_trunc('month', CURRENT_DATE)
                        AND b.attendance = 'attended') AS monthly_revenue,

                -- К-сть найближчих тренувань
                (SELECT COUNT(*)
                    FROM trainings tr
                    WHERE tr.trainer_id = t.id
                        AND tr.date >= CURRENT_DATE
                        AND tr.status = 'active') AS upcoming_sessions
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
            sessionsThisMonth: trainer.sessions_this_month,
            monthlyRevenue: trainer.monthly_revenue,
            upcomingSessions: trainer.upcoming_sessions
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

exports.updateTrainer = async (req, res) => {
    try {
        const { firstname, lastname, username, gender, email, phone, specialization, bio } = req.body;
        const userId = req.user.userId;

        await db.pool.query('BEGIN');

        // Оновлення таблиці users
        const queryUser = `UPDATE users SET firstname = $1, lastname = $2, username = $3, gender = $4, email = $5, phone = $6 WHERE id = $7`;
        const valuesUser = [firstname, lastname, username, gender, email, phone, userId];
        await db.pool.query(queryUser, valuesUser);

        // Оновлення таблиці trainers
        const queryTrainer = `UPDATE trainers SET specialization = $1, bio = $2 WHERE user_id = $3`;
        const valuesTrainer = [specialization, bio, userId];
        await db.pool.query(queryTrainer, valuesTrainer);

        await db.pool.query('COMMIT');

        res.json({ 
            success: true, 
            message: 'Профіль успішно оновлено' 
        });
    } catch (error) {
        await db.pool.query('ROLLBACK');
        console.error('Error updating user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Помилка оновлення профілю' 
        });
    }
};

exports.getTrainerActiveTrainings = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Отримуємо ID тренера
        const query = `SELECT id FROM trainers WHERE user_id = $1`;
        const values = [userId];

        const { rows } = await db.pool.query(query, values);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Тренер не знайдений' });
        }
        
        const trainerId = rows[0].id;
        
        // Отримуємо тренування тренера з категоріями
        const trainingsQuery = `
            SELECT 
                tr.id,
                tr.name,
                tr.time,
                tr.date,
                tr.duration,
                tr.price,
                tr.max_participants,
                tr.current_participants,
                tr.status,
                c.category
            FROM trainings tr
            JOIN categories c ON tr.category_id = c.id
            WHERE tr.trainer_id = $1 AND tr.status = 'active'
            ORDER BY tr.name
        `;
        
        const trainings = await db.pool.query(trainingsQuery, [trainerId]);
        
        res.json({
            trainings: trainings.rows
        });
        
    } catch (error) {
        console.error('Error fetching trainer trainings:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
}

exports.getTrainerTrainings = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Отримуємо ID тренера
        const query = `SELECT id FROM trainers WHERE user_id = $1`;
        const values = [userId];

        const { rows } = await db.pool.query(query, values);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Тренер не знайдений' });
        }
        
        const trainerId = rows[0].id;
        
        // Отримуємо тренування тренера з категоріями
        const trainingsQuery = `
            SELECT 
                tr.id,
                tr.name,
                tr.time,
                tr.date,
                tr.duration,
                tr.price,
                tr.max_participants,
                tr.current_participants,
                tr.status,
                tr.visible,
                tr.category_id,
                c.category
            FROM trainings tr
            JOIN categories c ON tr.category_id = c.id
            WHERE tr.trainer_id = $1
            ORDER BY 
                CASE WHEN tr.status = 'active' THEN 1 ELSE 2 END,
                tr.created_at DESC
        `;
        
        const trainings = await db.pool.query(trainingsQuery, [trainerId]);
        
        res.json({
            trainings: trainings.rows
        });
        
    } catch (error) {
        console.error('Error fetching all trainers trainings:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
}

exports.getTrainerReviews = async (req, res) => {
  try {
    const userId = req.user.userId;
        
    // Отримуємо ID тренера
    const query = `SELECT id FROM trainers WHERE user_id = $1`;
    const values = [userId];

    const { rows } = await db.pool.query(query, values);
        
    if (rows.length === 0) {
        return res.status(404).json({ error: 'Тренер не знайдений' });
    }
        
    const trainerId = rows[0].id;

    const queryInfo = `
        SELECT
            r.id,
            r.rating,
            r.review,
            r.created_at,
            u.firstname, 
            u.lastname
        FROM reviews r
        JOIN bookings b ON r.booking_id = b.id
        JOIN users u ON b.user_id = u.id
        JOIN trainings t ON b.training_id = t.id
        WHERE t.trainer_id = $1
        ORDER BY r.created_at DESC
        LIMIT 10;
    `;
    const reviews = await db.pool.query(queryInfo, [trainerId]);
    res.json({ reviews: reviews.rows });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Помилка отримання відгуків' });
  }
};