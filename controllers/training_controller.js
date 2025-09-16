const db = require('../services/db');

exports.addTraining = async (req, res) => {
    try {
    const { type, name, duration, price, max_participants } = req.body;
    const trainerId = req.user.userId;

    const query = 'INSERT INTO trainings (trainer_id, type, name, duration, price, max_participants) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
    const values = [trainerId, type, name, duration, price, max_participants];
    const { rows } = await db.pool.query(query, values);

    res.status(201).json(rows[0]);
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