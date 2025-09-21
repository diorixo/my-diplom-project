const e = require('express');
const db = require('../services/db');

exports.bookTraining = async (req, res) => {
    try {
        const { training_id, notes } = req.body;
        const user_id = req.user.userId;
        const query = 'INSERT INTO bookings (user_id, training_id, notes) VALUES ($1, $2, $3) RETURNING id;';
        const values = [user_id, training_id, notes];
        const { rows } = await db.pool.query(query, values);
 
        res.status(201).json({ success: true, message: 'Запис створено' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Помилка при створенні бронювання' });
    }
}

exports.cancelBooking = async (req, res) => {
    try {
        const { id } = req.body;
        const user_id = req.user.userId;

        const query = `
                    DELETE FROM bookings 
                    WHERE id = $1 AND user_id = $2
                    RETURNING *;
                `;
        const values = [id, user_id];
        const { rows } = await db.pool.query(query, values);
        
        if (!rows.length) {
            return res.status(404).json({ 
                success: false, 
                message: 'Бронювання не знайдено або доступ заборонено' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Бронювання успішно видалено', 
            training: rows[0] 
        });
        
    } catch (error) {
        console.error('Error deleting booking', error);
        res.status(500).json({
            success: false,
            message: 'Помилка при видаленні бронювання'
        });
    }
};

exports.getUserBookings = async (req, res) => {
    try {
        const user_id = req.user.userId;

        const query = `
            SELECT 
                b.id AS id,
                b.notes,
                b.created_at AS bookingDate,
                b.attendance,
                t.name AS name,
                t.date,
                t.time,
                t.duration,
                u.firstname || ' ' || u.lastname AS trainer_name
            FROM bookings b
            JOIN trainings t ON b.training_id = t.id
            JOIN trainers tr ON t.trainer_id = tr.id
            JOIN users u ON tr.user_id = u.id
            WHERE b.user_id = $1;
        `;

        const { rows } = await db.pool.query(query, [user_id]);

        const result = rows.map(row => ({
            id: row.id,
            training: {
                name: row.name,
                trainer: { name: row.trainer_name },
                date: row.date,
                time: row.time,
                duration: `${row.duration} хв`
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
