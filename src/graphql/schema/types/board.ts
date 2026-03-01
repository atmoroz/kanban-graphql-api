export const boardTypes = `
  enum BoardVisibility {
    PUBLIC
    PRIVATE
  }

  type Board {
    id: ID!
    title: String!
    description: String
    visibility: BoardVisibility!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type BoardEdge {
    node: Board!
    cursor: String!
  }

  type BoardConnection {
    edges: [BoardEdge!]!
    pageInfo: PageInfo!
  }
`;
