import { createServer } from 'node:http';
import { createYoga } from 'graphql-yoga';
import { schema } from './graphql/schema';

const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
});

const server = createServer(yoga);

const PORT = 4001;

server.listen(PORT, () => {
  console.log(`🚀 GraphQL Yoga running at http://localhost:${PORT}/graphql`);
});

//Следующий шаг

// 👉 Epic-01 · Step 3 — Pagination
