const axios = require('axios');
const http = require('http');

// Disable HTTP Keep-Alive to prevent Jest open handle warnings (TCPWRAP)
const axiosInstance = axios.create({
  httpAgent: new http.Agent({ keepAlive: false })
});

const CATALOG_URL = 'http://localhost:3001';
const ORDER_URL = 'http://localhost:3002';
const QUERY_URL = 'http://localhost:3004';

describe('Microservices End-to-End Tests', () => {
  let createdOrderId;

  test('1. Catalog Service - Should fetch the seeded products', async () => {
    const { data, status } = await axiosInstance.get(`${CATALOG_URL}/products`);
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(4);
    
    const laptop = data.find(p => p.id === 1);
    expect(laptop).toBeDefined();
    expect(laptop.name).toBe('Laptop');
    
    console.log('✅ [Catalog] Fetched initial products reliably.');
  });

  test('2. Order Service - Should successfully create an order and call Stock via gRPC', async () => {
    const payload = {
      productId: 1, // Laptop
      quantity: 2,
      customerEmail: "e2e@test.com"
    };
    
    const { data, status } = await axiosInstance.post(`${ORDER_URL}/orders`, payload);
    
    expect(status).toBe(201);
    expect(data).toHaveProperty('id');
    expect(data.status).toBe('confirmed');
    
    createdOrderId = data.id;
    console.log(`✅ [Order] Successfully generated Order #${createdOrderId}. gRPC stock reservation passed.`);
  });

  test('3. Stock Service (via Order) - Should reject order if stock is insufficient', async () => {
    const payload = {
      productId: 1, // Laptop (initial 10, minus previous orders)
      quantity: 9999, // Extremely high amount
      customerEmail: "greedy@test.com"
    };
    
    try {
      await axiosInstance.post(`${ORDER_URL}/orders`, payload);
      // If the request succeeds, it means there's a problem with our validation, so we fail the test
      expect(true).toBe(false);
    } catch (error) {
      expect(error.response).toBeDefined();
      expect(error.response.status).toBe(409);
      expect(error.response.data.error).toContain('Insufficient stock');
      
      console.log('✅ [Stock] Correctly rejected the order due to insufficient stock over gRPC.');
    }
  });

  test('4. Stock Service (via Order) - Should reject order if product does not exist in store', async () => {
     // Let's create a *new* product dynamically. 
     // (Our current stock system relies on an in-memory hardcoded map for this exact scenario!)
     const { data: newProduct } = await axiosInstance.post(`${CATALOG_URL}/products`, {
       name: "TestItem", price: 10, stock: 100
     });

     try {
       await axiosInstance.post(`${ORDER_URL}/orders`, {
         productId: newProduct.id,
         quantity: 1,
         customerEmail: "fake@test.com"
       });
       expect(true).toBe(false);
     } catch (error) {
       expect(error.response.status).toBe(409);
       expect(error.response.data.error).toContain('not found in stock service');
       console.log('✅ [Stock] Cleanly rejected the order because stock-service does not have this new product.');
     }
  });

  test('5. Query Service (GraphQL) - Should combine data across services using GraphQL', async () => {
    // Make sure we have the variable created correctly
    expect(createdOrderId).toBeDefined();
    
    const query = {
      query: `
        query {
          orderById(id: "${createdOrderId}") {
            id
            productId
            quantity
            status
            customerEmail
          }
        }
      `
    };

    const { data, status } = await axiosInstance.post(QUERY_URL, query);
    expect(status).toBe(200);
    expect(data.errors).toBeUndefined(); // Assuming GraphQL returns without error
    expect(data.data.orderById).toBeDefined();
    
    const order = data.data.orderById;
    expect(order.id).toBe(String(createdOrderId));
    expect(order.productId).toBe("1");
    expect(order.customerEmail).toBe("e2e@test.com");
    
    console.log('✅ [Query/GraphQL] Successfully fetched the order by ID through GraphQL.');
  });

  test('6. Full Happy Path (GraphQL) - Should query products, create an order, and fetch it', async () => {
    // Step 1: Fetch products
    const productsQuery = {
      query: `
        query {
          products {
            id
            name
            price
            stock
          }
        }
      `
    };
    const productsResponse = await axiosInstance.post(QUERY_URL, productsQuery);
    expect(productsResponse.status).toBe(200);
    expect(productsResponse.data.data.products.length).toBeGreaterThan(0);
    const firstProduct = productsResponse.data.data.products.find(p => p.id === "1"); // Assuming Laptop is 1
    
    // Step 2: Create Order via GraphQL Mutation
    const createOrderMutation = {
      query: `
        mutation {
          createOrder(productId: "${firstProduct.id}", quantity: 1, customerEmail: "happy.path@test.com") {
            id
            status
            customerEmail
          }
        }
      `
    };
    const orderResponse = await axiosInstance.post(QUERY_URL, createOrderMutation);
    expect(orderResponse.status).toBe(200);
    expect(orderResponse.data.errors).toBeUndefined();
    
    const newOrder = orderResponse.data.data.createOrder;
    expect(newOrder.id).toBeDefined();
    expect(newOrder.status).toBe('confirmed');
    expect(newOrder.customerEmail).toBe("happy.path@test.com");

    const happyPathOrderId = newOrder.id;

    // Step 3: Fetch the newly created order
    const fetchOrderQuery = {
      query: `
        query {
          orderById(id: "${happyPathOrderId}") {
            id
            status
            quantity
          }
        }
      `
    };
    
    const fetchOrderResponse = await axiosInstance.post(QUERY_URL, fetchOrderQuery);
    expect(fetchOrderResponse.status).toBe(200);
    expect(fetchOrderResponse.data.data.orderById.id).toBe(happyPathOrderId);
    expect(fetchOrderResponse.data.data.orderById.quantity).toBe(1);

    console.log('✅ [Happy Path] Complete journey (Query -> Create -> Fetch) via GraphQL succeeded.');
  });
});
