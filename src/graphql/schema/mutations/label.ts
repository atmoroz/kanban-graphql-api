export const labelMutations = `
  type Mutation {
    createLabel(
      boardId: ID!
      name: String!
      color: String
    ): Label!

    updateLabel(
      id: ID!
      name: String
      color: String
    ): Label!

    deleteLabel(id: ID!): Boolean!
  }
`;
