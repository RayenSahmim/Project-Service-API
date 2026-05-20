const Joi = require('joi');
const pool = require('../db/index');
const { checkAndReserve } = require('../grpc/stockClient');
const { publishOrderCreated } = require('../kafka/producer');

const orderSchema = Joi.object({
  productId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().required(),
  customerEmail: Joi.string().email().required(),
});

async function createOrder(req, res) {
  const { error, value } = orderSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { productId, quantity, customerEmail } = value;

  // 1. Check and reserve stock via gRPC
  let stockResponse;
  try {
    stockResponse = await checkAndReserve(productId, quantity);
  } catch (err) {
    console.error('[order-service] gRPC error:', err.message);
    return res.status(503).json({ error: 'Stock service unavailable' });
  }

  if (!stockResponse.available) {
    return res.status(409).json({ error: stockResponse.message });
  }

  // 2. Persist the order
  try {
    const result = await pool.query(
      'INSERT INTO orders (product_id, quantity, customer_email, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [productId, quantity, customerEmail, 'confirmed'],
    );
    const order = result.rows[0];

    // 3. Publish Kafka event
    try {
      await publishOrderCreated({
        id: order.id,
        productId: order.product_id,
        quantity: order.quantity,
        customerEmail: order.customer_email,
        status: order.status,
      });
    } catch (err) {
      console.error('[order-service] Kafka publish error:', err.message);
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getOrders(_req, res) {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getOrderById(req, res) {
  try {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById
};
