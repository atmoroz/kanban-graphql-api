export const statusQueries = `
  type Query {
    boardStatuses(boardId: ID!): [Status!]!
    statusById(id: ID!): Status
  }
`;
