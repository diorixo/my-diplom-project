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
    	const { trainingId } = req.body;
    	const trainerId = req.user.userId;

    	const query = `DELETE FROM trainings WHERE id = $1 AND trainer_id = $2 RETURNING *;`;
    	const values = [trainingId, trainerId];
    	const { rows } = await db.pool.query(query, values);

    	if (!rows.length) return res.status(404).json({ error: "Тренування не знайдено або доступ заборонено" });

    	res.json({ message: "Тренування видалено", training: rows[0] });
  	} catch (err) {
    	console.error(err);
    	res.status(500).json({ error: "Помилка при видаленні тренування" });
  	}
};


exports.updateTraining = async (req, res) => {
  	try {
    	const { trainingId, type, name, duration, price, max_participants, status } = req.body;
    	const trainerId = req.user.userId;

    	const query = `UPDATE trainings SET type = $1, name = $2, duration = $3, price = $4, max_participants = $5, status = $6 WHERE id = $7 AND trainer_id = $8 RETURNING *;`;
    	const values = [type, name, duration, price, max_participants, status, trainingId, trainerId];
    	const { rows } = await db.pool.query(query, values);

    	if (!rows.length) return res.status(404).json({ error: "Тренування не знайдено або доступ заборонено" });

    	res.json(rows[0]);
  	} catch (err) {
    	console.error(err);
    	res.status(500).json({ error: "Помилка при оновленні тренування" });
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