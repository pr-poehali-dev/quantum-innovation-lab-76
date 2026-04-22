
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  avatar_url TEXT,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  game_date TIMESTAMP NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  max_players INTEGER NOT NULL DEFAULT 6,
  location VARCHAR(200) DEFAULT 'Клуб настольных игр',
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id),
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  points INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE task_completions (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id),
  user_id INTEGER REFERENCES users(id),
  completed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

INSERT INTO users (name, email, points) VALUES
  ('Алексей Громов', 'alexey@example.com', 340),
  ('Марина Соколова', 'marina@example.com', 290),
  ('Дмитрий Козлов', 'dmitry@example.com', 210),
  ('Ольга Белова', 'olga@example.com', 175),
  ('Иван Петров', 'ivan@example.com', 130),
  ('Наталья Лисова', 'natalia@example.com', 95),
  ('Сергей Орлов', 'sergey@example.com', 80),
  ('Анна Волкова', 'anna@example.com', 60);

INSERT INTO tasks (title, description, points) VALUES
  ('Первая победа', 'Выиграйте свою первую партию', 50),
  ('Знаток правил', 'Объясните правила новичку', 20),
  ('Серия побед', 'Выиграйте 3 партии подряд', 100),
  ('Участник турнира', 'Примите участие в турнире', 30),
  ('Ветеран клуба', 'Посетите 10 игровых вечеров', 80);

INSERT INTO games (title, description, game_date, duration_minutes, max_players, location) VALUES
  ('Колонизаторы', 'Классическая стратегическая игра на строительство поселений', NOW() + INTERVAL '2 hours', 120, 4, 'Зал А, стол 1'),
  ('Ticket to Ride', 'Захватывающее путешествие по железным дорогам Европы', NOW() + INTERVAL '5 hours', 90, 5, 'Зал А, стол 2'),
  ('Carcassonne', 'Укладывайте тайлы и завоёвывайте средневековые земли', NOW() + INTERVAL '1 day', 60, 6, 'Зал Б, стол 1'),
  ('7 Wonders', 'Постройте великое чудо света за три эпохи', NOW() + INTERVAL '1 day 3 hours', 90, 7, 'Зал Б, стол 2'),
  ('Dominion', 'Колодостроительная игра о средневековом королевстве', NOW() + INTERVAL '2 days', 60, 4, 'Зал А, стол 3'),
  ('Pandemic', 'Кооперативная игра: спасите мир от болезней вместе', NOW() + INTERVAL '3 days', 120, 4, 'Зал В, стол 1');

INSERT INTO bookings (game_id, user_id) VALUES
  (1, 1), (1, 2), (1, 3),
  (2, 4), (2, 5),
  (3, 1), (3, 6),
  (4, 2), (4, 3), (4, 4), (4, 5), (4, 6), (4, 7),
  (5, 8);
