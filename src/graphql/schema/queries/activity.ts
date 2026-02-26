export const activityQueries = `
  extend type Query {
    taskActivities(
      taskId: ID!
      first: Int
      after: String
      last: Int
      before: String
    ): ActivityConnection!

    boardActivities(
      boardId: ID!
      first: Int
      after: String
      last: Int
      before: String
    ): ActivityConnection!
  }
`;

