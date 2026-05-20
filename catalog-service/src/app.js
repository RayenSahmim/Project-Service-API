require('dotenv').config();
const express = require('express');
const migrate = require('./db/migrate');
const seed = require('./seed');
const productsRouter = require('./routes/products');
const { swaggerUi, specs } = require('./swagger');

const app = express();
app.use(express.json());
app.use('/products', productsRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

const PORT = parseInt(process.env.PORT) || 3001;

async function start() {
  await migrate();
  await seed();
  app.listen(PORT, () => console.log(`[catalog-service] Running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('[catalog-service] Fatal error:', err.message);
  process.exit(1);
});
