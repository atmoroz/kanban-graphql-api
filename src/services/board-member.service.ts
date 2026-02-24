import {
  addBoardMember,
  findBoardMember,
  listBoardMembers,
  removeBoardMember as removeMemberRecord,
  updateBoardMemberRole as updateMemberRoleRecord,
} from '../data/mock/board-members';
import { BoardRole } from '../graphql/schema/types/board-role';
import { assertBoardPermission, getUserBoardRole } from '../lib/permissions';
import { conflict, notFound, forbidden } from '../lib/errors';

/* ===== Invite ===== */

export function inviteBoardMember(input: {
  boardId: string;
  actorUserId: string;
  userId: string;
  role: BoardRole;
}) {
  assertBoardPermission(input.boardId, input.actorUserId, BoardRole.ADMIN);

  const existing = findBoardMember(input.boardId, input.userId);
  if (existing) {
    conflict('User is already a board member');
  }

  return addBoardMember({
    boardId: input.boardId,
    userId: input.userId,
    role: input.role,
  });
}

/* ===== Update role ===== */

export function updateBoardMemberRole(input: {
  boardId: string;
  actorUserId: string;
  userId: string;
  role: BoardRole;
}) {
  assertBoardPermission(input.boardId, input.actorUserId, BoardRole.OWNER);

  const member = findBoardMember(input.boardId, input.userId);
  if (!member) {
    notFound('BoardMember');
  }

  if (member.role === BoardRole.OWNER) {
    forbidden('Cannot change role of board owner');
  }

  return updateMemberRoleRecord(input.boardId, input.userId, input.role)!;
}

/* ===== Remove ===== */

export function removeBoardMember(input: {
  boardId: string;
  actorUserId: string;
  userId: string;
}) {
  assertBoardPermission(input.boardId, input.actorUserId, BoardRole.ADMIN);

  const member = findBoardMember(input.boardId, input.userId);
  if (!member) {
    notFound('BoardMember');
  }

  if (member.role === BoardRole.OWNER) {
    forbidden('Cannot remove board owner');
  }

  removeMemberRecord(input.boardId, input.userId);
  return true;
}

/* ===== List ===== */

export function getBoardMembers(input: {
  boardId: string;
  actorUserId: string;
}) {
  assertBoardPermission(input.boardId, input.actorUserId, BoardRole.VIEWER);

  return listBoardMembers(input.boardId);
}
