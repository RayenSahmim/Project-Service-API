const pool = require('./index');

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('[order-service] Migration complete');
}

module.exports = migrate;
