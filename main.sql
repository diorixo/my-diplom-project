-- Таблиця користувачів --
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    firstname VARCHAR(255),
    lastname VARCHAR(255),
    gender VARCHAR(10),
    email VARCHAR(50) DEFAULT 'email@gmail.com',
    phone VARCHAR(50) DEFAULT '+1111111',
    role VARCHAR(255) DEFAULT 'user' NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Функція, яка оновлює updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Тригер для таблиці users
CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

select * from users order by id;

SELECT id, username, role, firstname, lastname, gender, email, phone FROM users WHERE id = 1;
-------------------------------------------------------------------------------

-- Таблиця тренерів --
DROP TABLE IF EXISTS trainers CASCADE;
CREATE TABLE trainers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    specialization VARCHAR(255),
	bio VARCHAR(255),
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
	created_at TIMESTAMP DEFAULT now() NOT NULL,
	updated_at TIMESTAMP DEFAULT now() NOT NULL,

    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT rating_check CHECK (rating >= 0.00 AND rating <= 5.00)
);

-- Тригер для таблиці trainers
CREATE TRIGGER set_trainers_updated_at
BEFORE UPDATE ON trainers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

select * from trainers order by id;

INSERT INTO trainers (user_id) VALUES (2);
-------------------------------------------------------------------------------


-- Таблиця категорій тренувань --
DROP TABLE IF EXISTS categories CASCADE;
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    category VARCHAR(255) NOT NULL,
	created_at TIMESTAMP DEFAULT now() NOT NULL,
	updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Тригер для таблиці categories
CREATE TRIGGER set_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

INSERT INTO categories (category) VALUES
('Тренажерний зал'),
('Кардіо'),
('Йога'),
('Пілатес'),
('Кросфіт'),
('Бокс'),
('Плавання');

select * from categories order by id;
-------------------------------------------------------------------------------

-- Таблиця тренувань --
DROP TABLE IF EXISTS trainings CASCADE;
CREATE TABLE trainings (
    id SERIAL PRIMARY KEY,
    trainer_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    name VARCHAR(255),
	date DATE NOT NULL,
	time TIME NOT NULL,
    duration INTEGER NOT NULL,
	price INTEGER NOT NULL,
	max_participants INTEGER NOT NULL,
	current_participants INTEGER default 0,
	status VARCHAR(50) DEFAULT 'active',
	created_at TIMESTAMP DEFAULT now() NOT NULL,
	updated_at TIMESTAMP DEFAULT now() NOT NULL,

    
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE,
	FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
	CONSTRAINT duration_check CHECK (duration > 0),
    CONSTRAINT price_check CHECK (price >= 0),
	CONSTRAINT max_participants_check CHECK (max_participants >= 1)
);

-- Функція для підтримки лічильника current_participants
CREATE OR REPLACE FUNCTION update_training_participants()
RETURNS TRIGGER AS $$
BEGIN
    -- Коли додається новий запис
    IF TG_OP = 'INSERT' THEN
        UPDATE trainings
        SET current_participants = current_participants + 1
        WHERE id = NEW.training_id;
        RETURN NEW;
    END IF;

    -- Коли видаляється запис
    IF TG_OP = 'DELETE' THEN
        UPDATE trainings
        SET current_participants = current_participants - 1
        WHERE id = OLD.training_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Тригер для таблиці trainings
CREATE TRIGGER set_trainings_updated_at
BEFORE UPDATE ON trainings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

select * from trainings order by id;
UPDATE trainings SET 
			category_id = 1,
			name = 'New',
			date = '2025-10-10',
			time = '10:00:00',
			duration = 33,
			price = 22,
			max_participants = 3
		WHERE id = 10 AND trainer_id = 1 RETURNING *;
-------------------------------------------------------------------------------

-- Таблиця записів на тренування --
DROP TABLE IF EXISTS bookings CASCADE;
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    training_id INTEGER NOT NULL,
    notes VARCHAR(255),
	attendance VARCHAR(50) DEFAULT 'pending',
	created_at TIMESTAMP DEFAULT now() NOT NULL,
	updated_at TIMESTAMP DEFAULT now() NOT NULL,

    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (training_id) REFERENCES trainings(id) ON DELETE CASCADE
);

-- Тригер для таблиці bookings
CREATE TRIGGER bookings_update_trainings
AFTER INSERT OR DELETE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_training_participants();

-- Тригер для таблиці bookings
CREATE TRIGGER set_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

select * from bookings order by id;
------------------------------------------------------

-- Інше --
SELECT 
                u.id as user_id,
                u.username,
                u.firstname,
                u.lastname,
                u.gender,
                u.email,
                u.phone,
                TO_CHAR(u.created_at, 'DD.MM.YYYY') AS created_date,
                t.id as trainer_id,
                t.specialization,
                t.rating,
                t.total_reviews
            FROM users u
            JOIN trainers t ON u.id = t.user_id
            WHERE u.id = 2 AND u.role = 'trainer';


SELECT DISTINCT
    			t.id AS trainer_id,
    			u.firstname,
    			u.lastname
			FROM trainers t
			JOIN users u ON t.user_id = u.id
			JOIN trainings tr ON tr.trainer_id = t.id
			WHERE tr.status = 'active';

SELECT id FROM trainers WHERE user_id = 2;