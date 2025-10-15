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
	balance INT DEFAULT 0,
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

CREATE OR REPLACE FUNCTION update_trainer_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE trainers t
    SET 
        rating = COALESCE((
            SELECT ROUND(AVG(r.rating)::numeric, 2)
            FROM reviews r
            JOIN bookings b ON r.booking_id = b.id
            JOIN trainings tr ON b.training_id = tr.id
            WHERE tr.trainer_id = t.id
        ), 0),
        total_reviews = (
            SELECT COUNT(r.id)
            FROM reviews r
            JOIN bookings b ON r.booking_id = b.id
            JOIN trainings tr ON b.training_id = tr.id
            WHERE tr.trainer_id = t.id
        )
    WHERE t.id IN (
        SELECT tr.trainer_id
        FROM bookings b
        JOIN trainings tr ON b.training_id = tr.id
        WHERE b.id = NEW.booking_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Тригер для таблиці trainings
CREATE TRIGGER set_trainings_updated_at
BEFORE UPDATE ON trainings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

select * from trainings order by id;
-------------------------------------------------------------------------------

-- Таблиця записів на тренування --
DROP TABLE IF EXISTS bookings CASCADE;
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    training_id INTEGER, -- може бути NULL
    visit_type VARCHAR(50) DEFAULT 'group', -- group | free_visit | personal
    notes VARCHAR(255),
    attendance VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    updated_at TIMESTAMP DEFAULT now() NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (training_id) REFERENCES trainings(id) ON DELETE CASCADE
);

-- Тригер для таблиці bookings
CREATE TRIGGER set_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

INSERT INTO bookings (user_id, visit_type, notes, attendance) VALUES (1, 'free_visit', 'Самостійне тренування в залі', 'attended');

select * from bookings order by id;
------------------------------------------------------

-- Таблиця відгуків --
DROP TABLE IF EXISTS reviews CASCADE;
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    review VARCHAR(255),
	created_at TIMESTAMP DEFAULT now() NOT NULL,
	updated_at TIMESTAMP DEFAULT now() NOT NULL,

    
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Тригер для таблиці reviews
CREATE TRIGGER set_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS reviews_update_trainer ON reviews;
CREATE TRIGGER reviews_update_trainer
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_trainer_rating();

select * from reviews order by id;
------------------------------------------------------

-- Таблиця бонусного магазину --
DROP TABLE IF EXISTS bonus_products CASCADE;
CREATE TABLE IF NOT EXISTS bonus_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price INT NOT NULL,
    category VARCHAR(50) NOT NULL,
    image VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Індекси
CREATE INDEX idx_category ON bonus_products (category);
CREATE INDEX idx_active ON bonus_products (is_active);

-- Тригер для таблиці bonus_products
CREATE TRIGGER set_bonus_products_updated_at
BEFORE UPDATE ON bonus_products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Вставка тестових товарів
INSERT INTO bonus_products (name, description, price, category, image) VALUES
('Спортивна футболка', 'Якісна спортивна футболка з логотипом центру. Матеріал: 100% бавовна', 500, 'clothing', 'tshirt.jpg'),
('Абонемент на місяць', 'Безлімітний абонемент на всі види тренувань протягом місяця', 2000, 'subscriptions', 'subscription.jpg'),
('Спортивна пляшка', 'Термопляшка для води 750мл. Підтримує температуру до 12 годин', 300, 'accessories', 'bottle.jpg'),
('Рушник', 'М''який спортивний рушник з мікрофібри. Розмір: 80x40см', 400, 'accessories', 'towel.jpg'),
('Гантелі 5кг', 'Набір гантелей для домашніх тренувань. Покриття: неопрен', 1500, 'equipment', 'dumbbells.jpg'),
('Спортивні шорти', 'Зручні шорти для тренувань. Дихаючий матеріал', 600, 'clothing', 'shorts.jpg'),
('Спортивна сумка', 'Велика спортивна сумка з відділенням для взуття', 800, 'accessories', 'bag.jpg'),
('Абонемент на 3 місяці', 'Безлімітний абонемент на всі тренування на 3 місяці зі знижкою', 5000, 'subscriptions', 'subscription3.jpg'),
('Рукавички для фітнесу', 'Професійні рукавички для силових тренувань', 250, 'accessories', 'gloves.jpg'),
('Спортивний костюм', 'Комплект: штани та кофта. Ідеально для тренувань', 1200, 'clothing', 'tracksuit.jpg'),
('Йога-мат', 'Килимок для йоги та пілатесу. Товщина: 6мм', 700, 'equipment', 'yoga-mat.jpg'),
('Протеїновий шейкер', 'Шейкер для спортивного харчування 600мл', 200, 'accessories', 'shaker.jpg'),
('Еспандер', 'Набір еспандерів з різним рівнем опору', 450, 'equipment', 'resistance-band.jpg'),
('Спортивні кросівки', 'Професійні кросівки для тренувань. Різні розміри', 2500, 'clothing', 'sneakers.jpg'),
('Персональна тренування', 'Одна індивідуальна тренування з тренером', 1000, 'subscriptions', 'personal-training.jpg');

select * from bonus_products order by id;
------------------------------------------------------

-- Таблиця покупок --
DROP TABLE IF EXISTS purchases CASCADE;
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    price INT NOT NULL,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'completed',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES bonus_products(id) ON DELETE RESTRICT
);

-- Індекси
CREATE INDEX idx_user_id ON purchases (user_id);
CREATE INDEX idx_purchase_date ON purchases (purchase_date);

-- Тригер для таблиці purchases
-- Функція для перевірки балансу
CREATE OR REPLACE FUNCTION check_balance_before_purchase()
RETURNS TRIGGER AS $$
DECLARE
    user_balance INT;
    product_price INT;
BEGIN
    SELECT balance INTO user_balance FROM users WHERE id = NEW.user_id;
    SELECT price INTO product_price FROM bonus_products WHERE id = NEW.product_id;

    IF user_balance < product_price THEN
        RAISE EXCEPTION 'Недостатньо балів на рахунку';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Тригер
CREATE TRIGGER check_balance_before_purchase
BEFORE INSERT ON purchases
FOR EACH ROW
EXECUTE FUNCTION check_balance_before_purchase();

-- Функція для оновлення балансу
CREATE OR REPLACE FUNCTION update_balance_after_purchase()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET balance = balance - (SELECT price FROM bonus_products WHERE id = NEW.product_id)
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Тригер
CREATE TRIGGER update_balance_after_purchase
AFTER INSERT ON purchases
FOR EACH ROW
EXECUTE FUNCTION update_balance_after_purchase();

select * from purchases order by id;
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