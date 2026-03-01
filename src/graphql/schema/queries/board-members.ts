export const boardMemberQueries = `
  extend type Query {
    boardMembers(boardId: ID!): [BoardMember!]!
  }
`;
