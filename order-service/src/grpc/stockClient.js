const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '../../proto/stock.proto');

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const stockProto = grpc.loadPackageDefinition(packageDef).stock;

const client = new stockProto.StockService(
  process.env.STOCK_SERVICE_GRPC || 'localhost:50051',
  grpc.credentials.createInsecure(),
);

function checkAndReserve(productId, quantity) {
  return new Promise((resolve, reject) => {
    client.CheckAndReserve({ productId, quantity }, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}

module.exports = { checkAndReserve };
