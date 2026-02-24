import 'dotenv/config';
import { createServer } from 'node:http';
import { createYoga } from 'graphql-yoga';
import { schema } from './graphql/schema';
import { createContext } from './graphql/context';

const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  context: createContext,
});

const server = createServer(yoga);

const PORT = 4001;

server.listen(PORT, () => {
  console.log(`🚀 GraphQL Yoga running at http://localhost:${PORT}/graphql`);
});
