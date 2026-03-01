export const boardMutations = `
  extend type Mutation {
    createBoard(
      title: String!
      description: String
      visibility: BoardVisibility!
    ): Board!

    updateBoard(
      id: ID!
      title: String
      description: String
      visibility: BoardVisibility
    ): Board!

    deleteBoard(id: ID!): Boolean!
  }
`;
