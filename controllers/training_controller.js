const db = require('../services/db');

exports.addTraining = async (req, res) => {
	try {
    const { category_id, name, date, time, duration, price, max_participants } = req.body;
    const userId = req.user.userId;

    // Отримуємо ID тренера
    const trainerQuery = 'SELECT id FROM trainers WHERE user_id = $1';
    const trainerResult = await db.pool.query(trainerQuery, [userId]);
    if (trainerResult.rows.length === 0) {
        return res.status(404).json({ error: 'Тренер не знайдений' });
    }
    const trainerId = trainerResult.rows[0].id;

    const query = 'INSERT INTO trainings (trainer_id, category_id, name, date, time, duration, price, max_participants) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id;';
    const values = [trainerId, category_id, name, date, time, duration, price, max_participants];
    const { rows } = await db.pool.query(query, values);

    res.status(201).json(rows[0].id);
  	} catch (err) {
		console.error(err);
    	res.status(500).json({ error: "Помилка при створенні тренування" });
  	}
}

exports.deleteTraining = async (req, res) => {
    try {
        const trainingId = req.params.id; // беремо ID тренування з URL
        const userId = req.user.userId;   // ID авторизованого користувача

        // Отримуємо ID тренера
        const trainerQuery = 'SELECT id FROM trainers WHERE user_id = $1';
        const trainerResult = await db.pool.query(trainerQuery, [userId]);
        if (trainerResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Тренер не знайдений' });
        }
        const trainerId = trainerResult.rows[0].id;

        // Видаляємо тренування, яке належить тренеру
        const query = `
            DELETE FROM trainings 
            WHERE id = $1 AND trainer_id = $2
            RETURNING *;
        `;
        const values = [trainingId, trainerId];
        const { rows } = await db.pool.query(query, values);

        if (!rows.length) {
            return res.status(404).json({ 
                success: false, 
                message: 'Тренування не знайдено або доступ заборонено' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Тренування успішно видалено', 
            training: rows[0] 
        });

    } catch (error) {
        console.error('Error deleting training', error);
        res.status(500).json({
            success: false,
            message: 'Помилка при видаленні тренування'
        });
    }
};


exports.updateTraining = async (req, res) => {
    try {
        const { id, name, category_id, duration, price, max_participants, date, time } = req.body;
        const userId = req.user.userId;

        // Отримуємо ID тренера
        const trainerQuery = 'SELECT id FROM trainers WHERE user_id = $1';
        const trainerResult = await db.pool.query(trainerQuery, [userId]);
        if (trainerResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Тренер не знайдений' });
        }
        const trainerId = trainerResult.rows[0].id;

        // Оновлюємо тренування
        const query = `
            UPDATE trainings SET
                category_id = $1,
                name = $2,
                date = $3,
                time = $4,
                duration = $5,
                price = $6,
                max_participants = $7
            WHERE id = $8 AND trainer_id = $9
            RETURNING *;
        `;
        const values = [category_id, name, date, time, duration, price, max_participants, id, trainerId];

        const { rows } = await db.pool.query(query, values);

        if (!rows.length) {
            return res.status(404).json({ 
                success: false, 
                message: 'Тренування не знайдено або доступ заборонено' 
            });
        }

        // Повертаємо оновлений тренінг
        res.json({
            success: true,
            message: 'Тренування успішно оновлено',
            training: rows[0]
        });

    } catch (error) {
        console.error('Error updating training', error);
        res.status(500).json({
            success: false,
            message: 'Помилка оновлення тренування'
        });
    }
};

exports.getActiveTrainers = async (req, res) => {
	try {
		const query = `
			SELECT DISTINCT
    			t.id,
    			u.firstname,
    			u.lastname,
				t.specialization 
			FROM trainers t
			JOIN users u ON t.user_id = u.id
			JOIN trainings tr ON tr.trainer_id = t.id
			WHERE tr.status = 'active';
		`;
		const { rows } = await db.pool.query(query);
		// if (rows.length === 0) {
		// 	return res.status(404).json({ error: 'Trainers not found' });
		// }
		return res.status(200).json({ 
			rows
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Internal server error' });
	}
};

exports.getActiveTrainings = async (req, res) => {
	try {
		const query = 'SELECT id, trainer_id, category_id, name, date, time, duration, price, max_participants, current_participants, status FROM trainings WHERE status = \'active\';';
		const { rows } = await db.pool.query(query);
		// if (rows.length === 0) {
		// 	return res.status(404).json({ error: 'Trainings not found' });
		// }
		return res.status(200).json({ 
			rows
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Internal server error' });
	}
};

exports.setTrainingStatusComplete = async (req, res) => {
	try {
		const { id } = req.body;
		const userId = req.user.userId;
		// Отримуємо ID тренера
		const trainerQuery = 'SELECT id FROM trainers WHERE user_id = $1';
		const trainerResult = await db.pool.query(trainerQuery, [userId]);
		if (trainerResult.rows.length === 0) {
			return res.status(404).json({ error: 'Тренер не знайдений' });
		}
		const trainerId = trainerResult.rows[0].id;
		// Оновлюємо статус тренування на 'complete'
		const query = `
			UPDATE trainings
			SET status = 'completed'
			WHERE id = $1 AND trainer_id = $2
			RETURNING *;
		`;
		const values = [id, trainerId];
		const { rows } = await db.pool.query(query, values);
		if (rows.length === 0) {
			return res.status(404).json({ error: 'Тренування не знайдено або доступ заборонено' });
		}
		res.json({ message: 'Статус тренування оновлено на complete', training: rows[0] });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Помилка при оновленні статусу тренування' });
	}
};

exports.getTrainingParticipants = async (req, res) => {
	try {
		const query = `
			SELECT DISTINCT
    			u.firstname,
    			u.lastname,
                u.email,
                u.phone,
				b.created_at,
                b.attendance
			FROM bookings b
			JOIN users u ON b.user_id = u.id
			WHERE b.training_id = $1;
		`;
		const { rows } = await db.pool.query(query, [req.params.trainingId]);
		// if (rows.length === 0) {
		// 	return res.status(404).json({ error: 'Trainings not found' });
		// }
        return res.status(200).json({ participants: rows });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Internal server error' });
	}
};