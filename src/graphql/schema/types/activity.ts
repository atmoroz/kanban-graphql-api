export const activityTypes = `
  enum ActivityEntityType {
    TASK
    COLUMN
    BOARD
  }

  enum ActivityAction {
    CREATE
    UPDATE
    MOVE
    DELETE
  }

  type Activity {
    id: ID!
    actorId: ID!
    actor: User
    entityType: ActivityEntityType!
    entityId: ID!
    action: ActivityAction!
    diff: String
    createdAt: DateTime!
  }

  type ActivityEdge {
    node: Activity!
    cursor: String!
  }

  type ActivityConnection {
    edges: [ActivityEdge!]!
    pageInfo: PageInfo!
  }
`;

