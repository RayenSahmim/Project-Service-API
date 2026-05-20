require('dotenv').config();
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const stockController = require('./controllers/stock.controller');

const PROTO_PATH = path.join(__dirname, '../proto/stock.proto');

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const stockProto = grpc.loadPackageDefinition(packageDef).stock;

const host = process.env.GRPC_HOST || '0.0.0.0';
const port = process.env.GRPC_PORT || '50051';
const address = `${host}:${port}`;

const server = new grpc.Server();
server.addService(stockProto.StockService.service, { CheckAndReserve: stockController.checkAndReserve });

server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
  if (err) {
    console.error('[stock-service] Failed to bind:', err.message);
    process.exit(1);
  }
  console.log(`[stock-service] gRPC server running on ${host}:${boundPort}`);
});
