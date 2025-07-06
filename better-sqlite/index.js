const Database = require('better-sqlite3');
const db = new Database('data.sqlite');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )
`);

const insert = db.prepare('INSERT INTO users (name) VALUES (?)');
insert.run('Alice');
insert.run('Bob');

const stmt = db.prepare('SELECT * FROM users');
const users = stmt.all();
console.log(users);
