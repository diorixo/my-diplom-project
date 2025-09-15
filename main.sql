drop table users;

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
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

select * from users order by id;

SELECT id, username, role, firstname, lastname, gender, email, phone FROM users WHERE id = 1;


CREATE TABLE coaches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    specialization VARCHAR(255),
    certification VARCHAR(500),
    phone VARCHAR(20),
    email VARCHAR(255),
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,

    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT rating_check CHECK (rating >= 0.00 AND rating <= 5.00),
);