const express = require("express");
const { createClient } = require("redis");
const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

// PostgreSQL
const pg = new Pool({
  host: "localhost",
  port: "5432",
  user: "postgres",
  password: "postgres",
  database: "reservation_db",
});

// Redis
const redis = createClient({ url: `redis://localhost:6379` });
const sub = redis.duplicate();
(async () => {
  await redis.connect();
  await sub.connect();
  await sub.configSet("notify-keyspace-events", "Ex");
  await sub.subscribe("__keyevent@0__:expired", async (msg) => {
    if (msg.startsWith("reservation:")) {
      const [, item] = msg.split(":");
      console.log(`[REDIS] expired ${msg}, incrementing counter for ${item}`);
      await redis.incr(`counter:${item}`);
    }
  });
})();

// /v1/reservation: Pessimistic Lock with PostgreSQL
app.post("/v1/reservation", async (req, res) => {
  const { userId } = req.body;
  const client = await pg.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT quantity FROM stock FOR UPDATE");
    const quantity = result.rows[0]?.quantity || 0;
    if (quantity <= 0) throw new Error("Sold out");
    await client.query("UPDATE stock SET quantity = quantity - 1");
    await client.query("INSERT INTO orders (userId) VALUES ($1)", [userId]);
    await client.query("COMMIT");
    console.log("reservation success", userId);
    res.send({ message: "Reservation successful" });
  } catch (err) {
    console.log("reservation failed", userId);
    await client.query("ROLLBACK");
    res.status(400).send({ error: err.message });
  } finally {
    client.release();
  }
});

// /v2/reservation: Redis-based counter + TTL key
app.post("/v2/reservation", async (req, res) => {
  const { userId } = req.body;
  const key = `reservation:${userId}`;
  const counterKey = `counter`;
  const count = await redis.decr(counterKey);
  if (count < 0) {
    await redis.incr(counterKey); // rollback
    console.log("reservation failed", userId);
    return res.status(400).send({ error: "Sold out" });
  }
  await redis.set(key, "", { EX: 600 });
  console.log("reservation success", userId);
  res.send({ message: "Reserved via Redis", key });
});

// /v1/get: Get stock from PostgreSQL
app.get("/v1/get", async (req, res) => {
  console.log("get");
  const result = await pg.query("SELECT quantity FROM stock");
  res.send({ quantity: result.rows[0]?.quantity || 0 });
});

// /v2/get: Get counter from Redis
app.get("/v2/get", async (req, res) => {
  console.log("get");
  const val = await redis.get(`counter`);
  res.send({ quantity: parseInt(val) || 0 });
});

app.listen(3000, () => console.log("Server running on port 3000"));
