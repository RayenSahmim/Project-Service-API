require('dotenv').config();
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { typeDefs, resolvers } = require('./schema');

async function start() {
  const server = new ApolloServer({ typeDefs, resolvers });

  const PORT = parseInt(process.env.PORT) || 3004;
  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
  });

  console.log(`[query-service] GraphQL running at ${url}`);
}

start().catch((err) => {
  console.error('[query-service] Fatal error:', err.message);
  process.exit(1);
});
