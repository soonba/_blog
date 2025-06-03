

CREATE TABLE IF NOT EXISTS stock (
  id SERIAL PRIMARY KEY,
  item TEXT UNIQUE,
  quantity INT
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  userId INT,
  reserved_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO stock (item, quantity)
VALUES ('item-1', 100)
ON CONFLICT (item) DO NOTHING;
