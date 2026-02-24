export const tasksByBoardQuery = `
  extend type Query {
    tasksByBoard(
      boardId: ID!
      query: String
      statusIds: [ID!]
      priority: [TaskPriority!]
      assigneeId: ID
      labelIds: [ID!]
      dueFilter: DueFilter
      sortBy: TaskSortBy
      sortOrder: SortOrder
      first: Int
      after: String
      last: Int
      before: String
    ): TaskConnection!
  }
`;
