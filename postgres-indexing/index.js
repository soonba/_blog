const { Client } = require("pg");

const generateRandomCode = (length = 11) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

function getRandomSpecialBoolean() {
  return Math.random() >= 0.5;
}

function getRandomCategory() {
  const categories = [
    "electronics",
    "furniture",
    "clothing",
    "books",
    "kitchen",
  ];
  return categories[Math.floor(Math.random() * categories.length)];
}

(async () => {
  const client = new Client({
    user: "testuser",
    password: "testpass",
    database: "testdb",
  });

  await client.connect();
  console.log("Inserting product data...");

  for (let index = 0; index < 15; index++) {
    const count = 1000;

    let sql =
      "INSERT INTO product(code, is_special, category, attributes_json, attributes_jsonb) VALUES ";
    for (let i = 0; i < count; i++) {
      const code = generateRandomCode();
      const isSpecial = getRandomSpecialBoolean();
      const category = getRandomCategory();
      sql += `('${code}',${isSpecial}, '${category}', '${JSON.stringify({
        code,
        isSpecial,
        category,
      })}', '${JSON.stringify({ code, isSpecial, category })}'),`;
    }
    await client.query(sql.slice(0, sql.length - 1));

    console.log("Done." + index);
  }

  await client.end();
})();
