export const pendingInviteMutations = `
  extend type Mutation {
    inviteByEmail(
      boardId: ID!
      email: String!
      role: BoardRole!
    ): PendingInvite!
  }
`;

