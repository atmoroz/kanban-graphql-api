export const healthTypeDefs = `
  type Query {
    health: String!
    version: String!
  }
`;

export const healthResolvers = {
  Query: {
    health: () => 'ok',
    version: () => '0.1.0',
  },
};
