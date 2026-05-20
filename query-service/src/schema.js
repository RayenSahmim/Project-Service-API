const queryController = require('./controllers/query.controller');

const typeDefs = `#graphql
  type Product {
    id: ID!
    name: String!
    price: Float!
    stock: Int!
  }

  type Order {
    id: ID!
    productId: ID!
    quantity: Int!
    status: String!
    customerEmail: String!
  }

  type Query {
    products: [Product!]!
    orders: [Order!]!
    orderById(id: ID!): Order
  }

  type Mutation {
    createOrder(productId: ID!, quantity: Int!, customerEmail: String!): Order!
  }
`;

const resolvers = {
  Query: {
    products: () => queryController.getProducts(),
    orders: () => queryController.getOrders(),
    orderById: (_parent, { id }) => queryController.getOrderById(id),
  },
  Mutation: {
    createOrder: (_parent, { productId, quantity, customerEmail }) => 
      queryController.createOrder(productId, quantity, customerEmail),
  },
};

module.exports = { typeDefs, resolvers };
