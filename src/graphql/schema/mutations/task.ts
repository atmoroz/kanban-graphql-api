export const taskMutations = `
  extend type Mutation {
    createTask(
      columnId: ID!
      title: String!
      description: String
      priority: TaskPriority!
      dueDate: DateTime
      assigneeId: ID
    ): Task!

    updateTask(
      id: ID!
      title: String
      description: String
      priority: TaskPriority
      dueDate: DateTime
      assigneeId: ID
    ): Task!

    deleteTask(id: ID!): Boolean!

    moveTask(
      id: ID!
      columnId: ID!
      position: Int
    ): Task!

    updateTaskLabels(
      taskId: ID!
      labelIds: [ID!]!
    ): Task!      
  }
`;
