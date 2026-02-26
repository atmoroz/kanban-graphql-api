export const pendingInviteQueries = `
  extend type Query {
    pendingInvites(boardId: ID!): [PendingInvite!]!
    pendingInvitesByEmail(email: String!): [PendingInvite!]!
  }
`;

