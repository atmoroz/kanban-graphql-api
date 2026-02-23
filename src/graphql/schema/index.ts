// import { createSchema } from 'graphql-yoga';
// import { forbidden } from '../../lib/errors';

// export const schema = createSchema({
//   typeDefs: /* GraphQL */ `
//     type Query {
//       health: String!
//       errorTest: String!
//     }
//   `,
//   resolvers: {
//     Query: {
//       health: () => 'ok',
//       errorTest: () => {
//         forbidden('You are not allowed to do this', 'TEST_ENTITY');
//       },
//     },
//   },
// });

import { createSchema } from 'graphql-yoga';
import { paginateArray, PaginationArgs } from '../../lib/pagination';

const MOCK_ITEMS = [
  { id: '1', name: 'A' },
  { id: '2', name: 'B' },
  { id: '3', name: 'C' },
];

export const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Item {
      id: ID!
      name: String!
    }

    type ItemEdge {
      node: Item!
      cursor: String!
    }

    type PageInfo {
      hasNextPage: Boolean!
      hasPreviousPage: Boolean!
      startCursor: String
      endCursor: String
    }

    type ItemConnection {
      edges: [ItemEdge!]!
      pageInfo: PageInfo!
    }

    type Query {
      items(
        first: Int
        after: String
        last: Int
        before: String
      ): ItemConnection!
    }
  `,
  resolvers: {
    Query: {
      items: (_: any, args: PaginationArgs) => paginateArray(MOCK_ITEMS, args),
    },
  },
});
