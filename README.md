# Project-Service-API

Mini microservices platform — REST · gRPC · Kafka · GraphQL  
Stack: **Express.js** + **PostgreSQL** + **KafkaJS** + **gRPC** + **Apollo Server**

---

## Architecture

```
Client HTTP
├── REST ──────────> catalog-service (port 3001)
├── REST ──────────> order-service   (port 3002)
│                        │
│                        ├── gRPC ──────> stock-service (port 50051)
│                        └── Kafka topic: order.created ──> notification-service
└── GraphQL ───────> query-service   (port 3004)
                         │
                         ├── REST ──> catalog-service
                         └── REST ──> order-service
```

| Service              | Role                            | Technology          |
|----------------------|---------------------------------|---------------------|
| catalog-service      | Product CRUD                    | REST + PostgreSQL   |
| order-service        | Order creation & tracking       | REST + gRPC + Kafka |
| stock-service        | Stock validation & reservation  | gRPC                |
| notification-service | Order event consumer            | Kafka               |
| query-service        | Aggregated read API             | GraphQL             |

---

## Prerequisites

- Node.js 20+
- Docker + Docker Compose
- npm

---

## Quick start

### 1 — Start Kafka and PostgreSQL

```bash
docker compose up -d
```

### 2 — Install dependencies and start each service

Open a terminal per service:

```bash
# catalog-service  (port 3001)
cd catalog-service && cp .env.example .env && npm install && npm start

# stock-service   (gRPC port 50051)
cd stock-service  && cp .env.example .env && npm install && npm start

# order-service   (port 3002)
cd order-service  && cp .env.example .env && npm install && npm start

# notification-service
cd notification-service && cp .env.example .env && npm install && npm start

# query-service   (port 3004)
cd query-service  && cp .env.example .env && npm install && npm start
```

---

## Sample requests

### Create products
```bash
curl -X POST http://localhost:3001/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","price":1200,"stock":10}'

curl -X POST http://localhost:3001/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Mouse","price":25,"stock":50}'
```

### List products
```bash
curl http://localhost:3001/products
```

### Create a valid order
```bash
curl -X POST http://localhost:3002/orders \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"quantity":2,"customerEmail":"client@test.com"}'
```

### Create an order with insufficient stock (returns 409)
```bash
curl -X POST http://localhost:3002/orders \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"quantity":9999,"customerEmail":"client@test.com"}'
```

### GraphQL queries
Open http://localhost:3004 and run:

```graphql
query {
  products {
    id
    name
    price
    stock
  }
  orders {
    id
    productId
    quantity
    status
    customerEmail
  }
}

query {
  orderById(id: "1") {
    id
    status
    customerEmail
  }
}
```

---

## Why REST, gRPC, Kafka, and GraphQL each play a different role

| Protocol  | Why here                                                                                     |
|-----------|----------------------------------------------------------------------------------------------|
| **REST**  | Standard HTTP CRUD — simple to expose, easy to consume from any client.                      |
| **gRPC**  | Synchronous, strongly-typed RPC for stock validation — low latency, contract-first with Protobuf. |
| **Kafka** | Asynchronous event bus — order-service does not need to wait for notification-service; decouples producers from consumers and enables replaying events. |
| **GraphQL** | Single endpoint for aggregated reads — the client specifies exactly which fields it needs across multiple services. |

---

## Ports summary

| Service              | Port  | Protocol |
|----------------------|-------|----------|
| catalog-service      | 3001  | HTTP     |
| order-service        | 3002  | HTTP     |
| stock-service        | 50051 | gRPC     |
| notification-service | —     | Kafka    |
| query-service        | 3004  | HTTP/GraphQL |
| PostgreSQL           | 5432  | TCP      |
| Kafka                | 9092  | TCP      |
| Zookeeper            | 2181  | TCP      |
