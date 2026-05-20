async function handleOrderCreated({ topic, partition, message }) {
  const order = JSON.parse(message.value.toString());
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] [notification-service] Confirmation sent to ${order.customerEmail} for order ${order.id}`);
  console.log(`  -> Email: "Your order #${order.id} for ${order.quantity}x product #${order.productId} has been confirmed! Status: ${order.status}"`);
}

module.exports = {
  handleOrderCreated,
};
