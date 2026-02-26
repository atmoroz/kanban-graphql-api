export const pendingInviteTypes = `
  enum InviteStatus {
    PENDING
    ACCEPTED
  }

  type PendingInvite {
    id: ID!
    boardId: ID!
    email: String!
    role: BoardRole!
    invitedByUserId: ID!
    invitedBy: User
    status: InviteStatus!
    createdAt: DateTime!
    acceptedAt: DateTime
    emailSentAt: DateTime
  }
`;

