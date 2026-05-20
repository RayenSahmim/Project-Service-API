const axios = require('axios');

const CATALOG_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:3001';
const ORDER_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3002';

function mapOrder(o) {
  return {
    id: String(o.id),
    productId: String(o.product_id),
    quantity: o.quantity,
    status: o.status,
    customerEmail: o.customer_email,
  };
}

async function getProducts() {
  const { data } = await axios.get(`${CATALOG_URL}/products`);
  return data;
}

async function getOrders() {
  const { data } = await axios.get(`${ORDER_URL}/orders`);
  return data.map(mapOrder);
}

async function getOrderById(id) {
  try {
    const { data } = await axios.get(`${ORDER_URL}/orders/${id}`);
    return mapOrder(data);
  } catch (err) {
    if (err.response && err.response.status === 404) return null;
    throw err;
  }
}

async function createOrder(productId, quantity, customerEmail) {
  const { data } = await axios.post(`${ORDER_URL}/orders`, {
    productId,
    quantity,
    customerEmail,
  });
  return mapOrder(data);
}

module.exports = {
  getProducts,
  getOrders,
  getOrderById,
  createOrder,
};
