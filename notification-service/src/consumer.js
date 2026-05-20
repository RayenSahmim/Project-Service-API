require('dotenv').config();
const { Kafka } = require('kafkajs');
const notificationController = require('./controllers/notification.controller');

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

async function start() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'order.created', fromBeginning: true });
  console.log('[notification-service] Listening on topic: order.created');

  await consumer.run({
    eachMessage: notificationController.handleOrderCreated,
  });
}

start().catch((err) => {
  console.error('[notification-service] Fatal error:', err.message);
  process.exit(1);
});
