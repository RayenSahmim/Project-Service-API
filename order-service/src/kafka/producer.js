const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const producer = kafka.producer();

async function connectProducer() {
  await producer.connect();
  console.log('[order-service] Kafka producer connected');
}

async function publishOrderCreated(order) {
  await producer.send({
    topic: 'order.created',
    messages: [
      {
        key: String(order.id),
        value: JSON.stringify(order),
      },
    ],
  });
  console.log(`[order-service] Published order.created for order ${order.id}`);
}

module.exports = { connectProducer, publishOrderCreated };
