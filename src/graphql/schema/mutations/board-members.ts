export const boardMemberMutations = `
  extend type Mutation {
    inviteBoardMember(
      boardId: ID!
      userId: ID!
      role: BoardRole!
    ): BoardMember!

    updateBoardMemberRole(
      boardId: ID!
      userId: ID!
      role: BoardRole!
    ): BoardMember!

    removeBoardMember(
      boardId: ID!
      userId: ID!
    ): Boolean!
  }
`;
