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

## E2E Testing

To run the End-to-End tests against the live services, install the npm test dependencies and run `npm run test`:

```bash
npm install
npm run test
```

### Result Analysis

When running the tests on a fresh environment (e.g., after running `docker compose down -v && docker compose up --build -d`), the test suite will successfully execute the full Happy Path, returning the following output:

```bash
> project-service-api-e2e@1.0.0 test
> jest --detectOpenHandles --verbose

  console.log
    ✅ [Catalog] Fetched initial products reliably.
  console.log
    ✅ [Order] Successfully generated Order #1. gRPC stock reservation passed.
  console.log
    ✅ [Stock] Correctly rejected the order due to insufficient stock over gRPC.
  console.log
    ✅ [Stock] Cleanly rejected the order because stock-service does not have this new product.
  console.log
    ✅ [Query/GraphQL] Successfully fetched the order by ID through GraphQL.
  console.log
    ✅ [Happy Path] Complete journey (Query -> Create -> Fetch) via GraphQL succeeded.

 PASS  tests/e2e.test.js
  Microservices End-to-End Tests
    ✓ 1. Catalog Service - Should fetch the seeded products (90 ms)
    ✓ 2. Order Service - Should successfully create an order and call Stock via gRPC (113 ms)
    ✓ 3. Stock Service (via Order) - Should reject order if stock is insufficient (80 ms)
    ✓ 4. Stock Service (via Order) - Should reject order if product does not exist in store (54 ms)
    ✓ 5. Query Service (GraphQL) - Should combine data across services using GraphQL (48 ms)
    ✓ 6. Full Happy Path (GraphQL) - Should query products, create an order, and fetch it (108 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

**Explanation of the Results:**
- **Tests 1 & 2:** Successfully test standard REST interactions and fundamental inter-service communication (gRPC between `order-service` and `stock-service`).
- **Tests 3 & 4:** Verify that the `stock-service` acts as a solid line of defense, preventing orders of items with insufficient stock or items that don't exist.
- **Test 5:** Proves the GraphQL `query-service` accurately queries and resolves data persisted by the other microservices.
- **Test 6 (Happy Path):** Simulates a full, realistic user journey connecting multiple services through the single GraphQL endpoint: querying available products, firing a mutation to generate an order (which is checked natively against the external Stock gRPC service), and subsequently confirming the order state using an immediate fetch query. 

*(Note: Running the tests multiple times consecutively without resetting the Docker containers will cause the tests to deplete the stock. The Stock Service will then continuously throw a `409 Conflict` until the environment is brought back up fresh!)*

### Swagger UI (API Documentation)
Both REST services expose a Swagger UI. You can access them directly in your browser:
- **Catalog Service:** [http://localhost:8080/catalog/api-docs](http://localhost:8080/catalog/api-docs) (or directly via `http://localhost:3001/api-docs`)
- **Order Service:** [http://localhost:8080/order/api-docs](http://localhost:8080/order/api-docs) (or directly via `http://localhost:3002/api-docs`)

---

## Running Tests

The project includes an end-to-end (E2E) test suite using Jest to verify the full microservices flow. 

1. Ensure the platform is running (see Quick start).
2. Install the test dependencies in the project root:
   ```bash
   npm install
   ```
3. Run the E2E test suite:
   ```bash
   npm test
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

