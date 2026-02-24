export const boardMemberTypes = `
  type BoardMember {
    boardId: ID!
    userId: ID!
    role: BoardRole!
    user: User!
  }
`;
