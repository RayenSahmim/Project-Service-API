require('dotenv').config();
const express = require('express');
const migrate = require('./db/migrate');
const ordersRouter = require('./routes/orders');
const { connectProducer } = require('./kafka/producer');
const { swaggerUi, specs } = require('./swagger');

const app = express();
app.use(express.json());
app.use('/orders', ordersRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

const PORT = parseInt(process.env.PORT) || 3002;

async function start() {
  await migrate();
  await connectProducer();
  app.listen(PORT, () => console.log(`[order-service] Running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('[order-service] Fatal error:', err.message);
  process.exit(1);
});
