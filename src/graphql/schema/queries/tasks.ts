export const taskQueries = `
  extend type Query {
    task(id: ID!): Task

    tasksByColumn(
      columnId: ID!
      first: Int
      after: String
      last: Int
      before: String
    ): TaskConnection!
  }
`;
