const e = require('express');
const db = require('../services/db');

exports.bookTraining = async (req, res) => {
    try {
        const { training_id, notes } = req.body;
        const user_id = req.user.userId;

        await db.pool.query('BEGIN');

        const query = 'INSERT INTO bookings (user_id, training_id, notes) VALUES ($1, $2, $3) RETURNING id;';
        const values = [user_id, training_id, notes];
        await db.pool.query(query, values);

        const updateTrainingQuery = 'UPDATE trainings SET current_participants = current_participants + 1 WHERE id = $1;';
        await db.pool.query(updateTrainingQuery, [training_id]);

        await db.pool.query('COMMIT');
 
        res.status(201).json({ success: true, message: 'Запис створено' });
    } catch (err) {
        await db.pool.query('ROLLBACK');
        console.error(err);
        return res.status(500).json({ 
            success: false,
            message: 'Помилка при створенні бронювання'
        });
    }
}

exports.cancelBooking = async (req, res) => {
    try {
        const { id } = req.body;
        const user_id = req.user.userId;

        await db.pool.query('BEGIN');

        // Знаходимо бронювання і блокуємо його
        const bookingQuery = `
            SELECT training_id, attendance
            FROM bookings
            WHERE id = $1 AND user_id = $2
            FOR UPDATE;
        `;
        const { rows: bookingRows } = await db.pool.query(bookingQuery, [id, user_id]);

        if (bookingRows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Бронювання не знайдено або доступ заборонено'
            });
        }

        const { training_id, attendance } = bookingRows[0];

        if (attendance === 'cancelled') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Бронювання вже скасовано'
            });
        }

        // Скасовуємо бронювання
        await db.pool.query(`
            UPDATE bookings
            SET attendance = 'cancelled'
            WHERE id = $1;
        `, [id]);

        // Зменшуємо кількість учасників, якщо тренування ще існує
        if (training_id) {
            await db.pool.query(`
                UPDATE trainings
                SET current_participants = GREATEST(current_participants - 1, 0)
                WHERE id = $1;
            `, [training_id]);
        }

        await db.pool.query('COMMIT');

        res.json({
            success: true,
            message: 'Бронювання успішно скасовано'
        });

    } catch (error) {
        await db.pool.query('ROLLBACK');
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Помилка при скасуванні бронювання'
        });
    }
};

exports.getUserBookings = async (req, res) => {
    try {
        const user_id = req.user.userId;

        const query = `
            SELECT 
                b.id,
                b.training_id,
                b.notes,
                b.created_at AS bookingDate,
                b.attendance,
                t.name,
                t.date,
                t.time,
                t.duration,
                t.price,
                u.firstname || ' ' || u.lastname AS trainer_name
            FROM bookings b
            JOIN trainings t ON b.training_id = t.id
            JOIN trainers tr ON t.trainer_id = tr.id
            JOIN users u ON tr.user_id = u.id
            WHERE b.user_id = $1 AND b.attendance = 'pending';
        `;

        const { rows } = await db.pool.query(query, [user_id]);

        const result = rows.map(row => ({
            id: row.id,
            training: {
                id: row.training_id,
                name: row.name,
                trainer: { name: row.trainer_name },
                date: row.date,
                time: row.time,
                duration: `${row.duration} хв`,
                price: `${row.price} грн`
            },
            notes: row.notes,
            bookingDate: row.bookingdate,
            status: row.attandence
        }));

        return res.status(200).json(result);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getUserAllBookings = async (req, res) => {
    try {
        const user_id = req.user.userId;

        const query = `
            SELECT 
                b.id,
                b.visit_type,
                b.notes,
                b.created_at AS bookingDate,
                b.attendance,
                t.name,
                t.category_id,
                c.category,
                -- Для самостійних тренувань використовуємо created_at як дату
                CASE 
                    WHEN b.visit_type = 'free_visit' AND t.date IS NULL THEN b.created_at::date
                    ELSE t.date
                END AS date,
                -- Для самостійних тренувань використовуємо created_at як час (форматуємо HH:MI)
                CASE 
                    WHEN b.visit_type = 'free_visit' AND t.time IS NULL THEN TO_CHAR(b.created_at, 'HH24:MI')
                    ELSE t.time::text
                END AS time,
                t.duration,
                u.firstname || ' ' || u.lastname AS trainer_name,
                t.price,
                r.rating,
                r.review
            FROM bookings b
            LEFT JOIN trainings t ON b.training_id = t.id
            LEFT JOIN trainers tr ON t.trainer_id = tr.id
            LEFT JOIN users u ON tr.user_id = u.id
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN reviews r ON r.booking_id = b.id
            WHERE b.user_id = $1
            ORDER BY 
                COALESCE(
                    CASE WHEN b.visit_type = 'free_visit' THEN b.created_at END,
                    t.date + COALESCE(t.time, '00:00:00'::time),
                    b.created_at
                ) DESC;
        `;

        const { rows } = await db.pool.query(query, [user_id]);

        const result = rows.map(row => ({
            id: row.id,
            visitType: row.visit_type,
            trainingName: row.name,
            trainerName: row.trainer_name,
            date: row.date,
            time: row.time,
            duration: row.duration ? `${row.duration} хв` : null,
            status: row.attendance,
            price: row.price,
            rating: row.rating || null,
            review: row.review || null,
            bookingDate: row.bookingdate,
            completedAt: row.attendance === 'attended' ? row.date : null,
            notes: row.notes,
            categoryId: row.category_id,
            categoryName: row.category
        }));

        return res.status(200).json(result);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateBookingAttendance = async (req, res) => {
    try {
        const userId = req.user.userId;
        const trainingId = req.params.id;
        const { attendance } = req.body;
        
        // Перевіряємо, чи належить тренування цьому тренеру
        const checkOwnershipQuery = `
            SELECT tr.id
            FROM trainings tr
            JOIN trainers t ON tr.trainer_id = t.id
            WHERE tr.id = $1 AND t.user_id = $2
        `;
        
        const ownership = await db.pool.query(checkOwnershipQuery, [trainingId, userId]);
        
        if (ownership.rows.length === 0) {
            return res.status(403).json({ error: 'Немає доступу до цього тренування' });
        }
        
        // Оновлюємо відвідуваність для кожного учасника
        await db.pool.query('BEGIN');
        
        for (const record of attendance) {
            const updateAttendanceQuery = `
                UPDATE bookings
                SET attendance = $1
                WHERE id = $2
            `;
            
            await db.pool.query(updateAttendanceQuery, [record.attendance, record.bookingId]);
        }
        
        await db.pool.query('COMMIT');
        
        res.json({ success: true, message: 'Відвідуваність збережена' });
        
    } catch (error) {
        await db.pool.query('ROLLBACK');
        console.error('Error saving attendance:', error);
        res.status(500).json({ error: 'Помилка при збереженні відвідуваності' });
    }
};

exports.rateTraining = async (req, res) => {
    try {
        const { visitId, rating, review } = req.body;
        const query = 'INSERT INTO reviews (booking_id, rating, review) VALUES ($1, $2, $3) RETURNING id;';
        const values = [visitId, rating, review];
        const { rows } = await db.pool.query(query, values);
 
        res.status(201).json({ success: true, message: 'Відгук створено' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Помилка при створенні відгука' });
    }
}

exports.updateRateTraining = async (req, res) => {
    try {
        const { visitId, rating, review } = req.body;
        const query = 'UPDATE reviews SET rating = $1, review = $2 WHERE booking_id = $3';
        const values = [ rating, review, visitId] ;
        await db.pool.query(query, values);
 
        res.status(201).json({ success: true, message: 'Відгук оновлено' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: 'Помилка при оновлені відгука' });
    }
}

exports.addBookingPersonal = async (req, res) => {
    try {
        const { user_id, training_id } = req.body;

        await db.pool.query('BEGIN');

        const query = 'INSERT INTO bookings (user_id, training_id, visit_type) VALUES ($1, $2, $3) RETURNING id;';
        const values = [user_id, training_id, 'personal'];
        await db.pool.query(query, values);

        const updateTrainingQuery = 'UPDATE trainings SET current_participants = current_participants + 1 WHERE id = $1;';
        await db.pool.query(updateTrainingQuery, [training_id]);

        await db.pool.query('COMMIT');
 
        res.status(201).json({ success: true, message: 'Запис створено' });
    } catch (err) {
        await db.pool.query('ROLLBACK');
        console.error(err);
        return res.status(500).json({ 
            success: false,
            message: 'Помилка при створенні бронювання'
        });
    }
}