// In-memory stock store — mirrors catalog seed data (product id -> quantity)
const stocks = {
  1: 10,
  2: 50,
  3: 30,
  4: 15,
};

function checkAndReserve(call, callback) {
  const { productId, quantity } = call.request;
  const id = parseInt(productId, 10);

  if (!Object.prototype.hasOwnProperty.call(stocks, id)) {
    return callback(null, {
      available: false,
      message: `Product ${id} not found in stock service`,
    });
  }

  const current = stocks[id];
  if (current < quantity) {
    return callback(null, {
      available: false,
      message: `Insufficient stock. Available: ${current}, requested: ${quantity}`,
    });
  }

  stocks[id] -= quantity;
  console.log(`[stock-service] Reserved ${quantity} unit(s) of product ${id}. Remaining: ${stocks[id]}`);
  callback(null, { available: true, message: `Successfully reserved ${quantity} unit(s)` });
}

module.exports = {
  checkAndReserve,
};
