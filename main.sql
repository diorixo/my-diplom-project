drop table users;

CREATE TABLE users (
 	id SERIAL PRIMARY KEY,
    username VARCHAR(255),
	firstname VARCHAR(255),
	lastname VARCHAR(255),
    gender VARCHAR(10),
	role VARCHAR(255) DEFAULT 'user',
    password VARCHAR(255)
);

select * from users order by id;

update users set role = 'admin' where id = 2;
update users set role = 'coach' where id = 2;


drop table coaches;

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
    CONSTRAINT rating_check CHECK (rating >= 0.00 AND rating <= 5.00)
);

select * from coaches order by id;