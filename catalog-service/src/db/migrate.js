const pool = require('./index');

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price NUMERIC(10,2) NOT NULL CHECK (price > 0),
      stock INTEGER NOT NULL CHECK (stock >= 0),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('[catalog-service] Migration complete');
}

module.exports = migrate;
