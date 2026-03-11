export const boardTypes = `
  enum BoardVisibility {
    PUBLIC
    PRIVATE
  }

  type BoardPermissions {
    moveColumn: Boolean!
    moveCard: Boolean!

    createColumn: Boolean!
    createTask: Boolean!

    updateTask: Boolean!
    deleteTask: Boolean!

    manageLabels: Boolean!

    inviteMember: Boolean!
    manageBoardMembers: Boolean!
  }

  type Board {
    id: ID!
    title: String!
    description: String
    visibility: BoardVisibility!
    createdAt: DateTime!
    updatedAt: DateTime!
     permissions: BoardPermissions!
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
