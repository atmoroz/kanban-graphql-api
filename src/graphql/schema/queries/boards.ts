export const boardQueries = `
  enum BoardSortBy {
    NAME
    CREATED_AT
    UPDATED_AT
  }

  extend type Query {
    board(id: ID!): Board

    boards(
      sortBy: BoardSortBy
      sortOrder: SortOrder
      visibility: BoardVisibility
      first: Int
      after: String
      last: Int
      before: String
    ): BoardConnection!
  }
`;
