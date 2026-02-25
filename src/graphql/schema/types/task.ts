export const taskTypes = `
  enum TaskPriority {
    LOW
    MEDIUM
    HIGH
  }

  type Task {
    id: ID!
    columnId: ID!
    title: String!
    description: String
    priority: TaskPriority!
    dueDate: DateTime
    assigneeId: ID
    position: Int!
    statusId: ID!
    labelIds: [ID!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type TaskEdge {
    node: Task!
    cursor: String!
  }

  type TaskConnection {
    edges: [TaskEdge!]!
    pageInfo: PageInfo!
  }
`;
