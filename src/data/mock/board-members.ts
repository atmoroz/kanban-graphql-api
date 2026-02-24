import { BoardRole } from '../../graphql/schema/types/board-role';

export type BoardMemberRecord = {
  boardId: string;
  userId: string;
  role: BoardRole;
};

export const boardMembers: BoardMemberRecord[] = [];

/* ===== Helpers ===== */

export function addBoardMember(input: BoardMemberRecord): BoardMemberRecord {
  boardMembers.push(input);
  return input;
}

export function findBoardMember(
  boardId: string,
  userId: string,
): BoardMemberRecord | undefined {
  return boardMembers.find(m => m.boardId === boardId && m.userId === userId);
}

export function listBoardMembers(boardId: string): BoardMemberRecord[] {
  return boardMembers.filter(m => m.boardId === boardId);
}

export function removeBoardMember(boardId: string, userId: string): void {
  const index = boardMembers.findIndex(
    m => m.boardId === boardId && m.userId === userId,
  );
  if (index >= 0) {
    boardMembers.splice(index, 1);
  }
}

export function updateBoardMemberRole(
  boardId: string,
  userId: string,
  role: BoardRole,
): BoardMemberRecord | undefined {
  const member = findBoardMember(boardId, userId);
  if (!member) return undefined;

  member.role = role;
  return member;
}
