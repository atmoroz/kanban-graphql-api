import { createSchema } from 'graphql-yoga';

export const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      health: String!
      version: String!
    }
  `,
  resolvers: {
    Query: {
      health: () => 'ok',
      version: () => '0.1.0',
    },
  },
});
