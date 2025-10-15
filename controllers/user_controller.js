const db = require('../services/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {secretKey} = require('../services/secretKey')

exports.registerUser = async (req, res) => {
    try {
        const { username, firstname, lastname, email, phone, gender, password } = req.body;

        const existsResult = await db.pool.query({
            text: 'select exists (select * from users where username = $1)',
            values: [username]
        })
        if (existsResult.rows[0].exists) {
            return res.status(409).send({ error: `Користувач ${username} вже існує`});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
      
        const query = 'INSERT INTO users (username, firstname, lastname, email, phone, gender, password) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id';
        const values = [username, firstname, lastname, email, phone, gender, hashedPassword];
        const { rows } = await db.pool.query(query, values);
        res.status(201).json({ message: `Користувач: ${username} зареєстрований під id: ${rows[0].id}` });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

exports.loginUser = async (req, res) => {
  try {
        const { username, password } = req.body;
        const query = 'SELECT * FROM users WHERE username = $1';
        const values = [username];
        const { rows } = await db.pool.query(query, values);
    
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Неправильний логін або пароль' });
        }
      
        const user = rows[0];
      
        const isPasswordValid = await bcrypt.compare(password, user.password);
      
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Неправильний логін або пароль' });
        }
        const token = jwt.sign({ userId: user.id, userRole: user.role }, secretKey, { expiresIn: '1h' });

        res.cookie('access_token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 3600000
        });
        res.status(200).json({ message: 'Успішна авторизація', isAuthenticated: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

exports.getUserData = async (req, res) => {
    try {
        const userId = req.user.userId;
        const query = 'SELECT id, username, role, firstname, lastname, gender, balance, email, phone, TO_CHAR(created_at, \'DD.MM.YYYY\') AS created_date FROM users WHERE id = $1';
        const values = [userId];
        const { rows } = await db.pool.query(query, values);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = rows[0];

        const visit_result = await db.pool.query(`
            SELECT COUNT(*) AS visit_count
            FROM bookings
            WHERE user_id = $1
                AND attendance = 'attended';
        `, [userId]);
        const visit_count = visit_result.rows[0].visit_count;

        return res.status(200).json({ 
            userId: user.id, 
            username: user.username,
            role: user.role,
            firstname: user.firstname,
            lastname: user.lastname,
            gender: user.gender,
            balance: user.balance,
            email: user.email,
            phone: user.phone,
            created_at: user.created_date,
            visit_count: visit_count
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

exports.updateUser = async (req, res) => {
    try {
        const { firstName, lastName, username, gender, email, phone } = req.body;
        const userId = req.user.userId;

        const query = 'UPDATE users SET firstName = $1, lastName = $2, username = $3, gender = $4, email = $5, phone = $6 WHERE id = $7';
        const values = [firstName, lastName, username, gender, email, phone, userId];
        await db.pool.query(query, values);
        
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

exports.getAllUsers = async (req, res) => {
    try {
        const user_id = req.user.userId;

        const query = 'SELECT id, firstname, lastname, email, phone FROM users WHERE role = \'user\' ORDER BY firstname, lastname';

        const result = await db.pool.query(query);

        return res.status(200).json({ users: result.rows });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Помилка завантаження користувачів' });
    }
};