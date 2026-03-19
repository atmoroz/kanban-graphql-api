export const realtimeSubscriptions = `
  extend type Subscription {
    taskCreated(boardId: ID!): Task!
    taskUpdated(boardId: ID!): Task!
    taskDeleted(boardId: ID!): Task!
    columnMoved(boardId: ID!): Column!
  }
`;

