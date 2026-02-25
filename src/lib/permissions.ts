import { forbidden, unauthorized } from './errors';
import { findBoardMember } from '../data/mock';
import { BoardRole } from '../graphql/schema/types/board-role';

/* ===== Role weights ===== */

const ROLE_WEIGHT: Record<BoardRole, number> = {
  [BoardRole.VIEWER]: 1,
  [BoardRole.MEMBER]: 2,
  [BoardRole.ADMIN]: 3,
  [BoardRole.OWNER]: 4,
};

/* ===== Helpers ===== */

export function getUserBoardRole(
  boardId: string,
  userId: string,
): BoardRole | null {
  const member = findBoardMember(boardId, userId);
  return member?.role ?? null;
}

export function hasBoardPermission(
  boardId: string,
  userId: string,
  requiredRole: BoardRole,
): boolean {
  const role = getUserBoardRole(boardId, userId);
  if (!role) return false;

  return ROLE_WEIGHT[role] >= ROLE_WEIGHT[requiredRole];
}

export function assertBoardPermission(
  boardId: string,
  userId: string | null | undefined,
  requiredRole: BoardRole,
): void {
  if (!userId) {
    unauthorized('Authentication required');
  }

  const allowed = hasBoardPermission(boardId, userId, requiredRole);

  if (!allowed) {
    forbidden('Insufficient permissions');
  }
}
