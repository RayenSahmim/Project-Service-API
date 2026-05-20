# Project-Service-API

Mini microservices platform — REST · gRPC · Kafka · GraphQL  
Stack: **Express.js** + **PostgreSQL** + **KafkaJS** + **gRPC** + **Apollo Server** + **NGINX**

---

## Architecture

```
Client HTTP
└── NGINX (API Gateway :8080)
    ├── /catalog/ ──> REST ────> catalog-service (port 3001)
    ├── /order/   ──> REST ────> order-service   (port 3002)
    │                                │
    │                                ├── gRPC ──────> stock-service (port 50051)
    │                                └── Kafka topic: order.created ──> notification-service
    └── /graphql  ──> GraphQL ─> query-service   (port 3004)
                                     │
                                     ├── REST ──> catalog-service
                                     └── REST ──> order-service
```

| Service              | Role                            | Technology          |
|----------------------|---------------------------------|---------------------|
| api-gateway          | Reverse proxy & routing         | NGINX               |
| catalog-service      | Product CRUD                    | REST + PostgreSQL   |
| order-service        | Order creation & tracking       | REST + gRPC + Kafka |
| stock-service        | Stock validation & reservation  | gRPC                |
| notification-service | Order event consumer            | Kafka               |
| query-service        | Aggregated read API             | GraphQL             |

---

## Prerequisites

- Docker + Docker Compose

---

## Quick start

### 1 — Start the entire stack

Because everything is containerized with Docker, you can simply run the following command at the root of the project:

```bash
docker compose up --build -d
```

This will automatically spin up Zookeeper, Kafka, PostgreSQL (with tables initialized), NGINX, and all the microservices.

### 2 — Verify services

You can check the logs to make sure everything started correctly:
```bash
docker compose logs -f
```

---

## Sample requests (via API Gateway)

### Create products
```bash
curl -X POST http://localhost:8080/catalog/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","price":1200,"stock":10}'

curl -X POST http://localhost:8080/catalog/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Mouse","price":25,"stock":50}'
```

### List products
```bash
curl http://localhost:8080/catalog/products
```

### Create a valid order
```bash
curl -X POST http://localhost:8080/order/orders \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"quantity":2,"customerEmail":"client@test.com"}'
```

### Create an order with insufficient stock (returns 409)
```bash
curl -X POST http://localhost:8080/order/orders \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"quantity":9999,"customerEmail":"client@test.com"}'
```

### GraphQL queries
Open http://localhost:8080/graphql (if you have Apollo Studio or GraphQL Playground configured) or run standard POST requests, for example:

```bash
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { products { id name price stock } }"}'
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

| Service              | Port  | Protocol     |
|----------------------|-------|--------------|
| api-gateway (NGINX)  | 8080  | HTTP         |
| catalog-service      | 3001  | HTTP         |
| order-service        | 3002  | HTTP         |
| stock-service        | 50051 | gRPC         |
| notification-service | —     | Kafka        |
| query-service        | 3004  | HTTP/GraphQL |
| PostgreSQL           | 5433  | TCP (Host)   |
| Kafka                | 9092  | TCP          |
| Zookeeper            | 2181  | TCP          |

