const pool = require('./db/index');

async function seed() {
  const { rows } = await pool.query('SELECT COUNT(*) FROM products');
  if (parseInt(rows[0].count) > 0) return;

  await pool.query(`
    INSERT INTO products (name, price, stock) VALUES
    ('Laptop', 1200, 10),
    ('Mouse', 25, 50),
    ('Keyboard', 75, 30),
    ('Monitor', 350, 15)
  `);
  console.log('[catalog-service] Seeded 4 initial products');
}

module.exports = seed;
