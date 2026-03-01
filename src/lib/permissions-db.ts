import { BoardRole as PrismaBoardRole } from '@prisma/client';
import { BoardRole } from '../graphql/schema/types/board-role';
import { forbidden, unauthorized } from './errors';
import { prisma } from './prisma';
import { assertBoardPermission, getUserBoardRole } from './permissions';

const ROLE_WEIGHT: Record<BoardRole, number> = {
  [BoardRole.VIEWER]: 1,
  [BoardRole.MEMBER]: 2,
  [BoardRole.ADMIN]: 3,
  [BoardRole.OWNER]: 4,
};

function mapRole(role: PrismaBoardRole): BoardRole {
  return role as BoardRole;
}

function isTestRuntime(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}

export async function getUserBoardRoleDb(
  boardId: string,
  userId: string,
): Promise<BoardRole | null> {
  if (isTestRuntime()) {
    return getUserBoardRole(boardId, userId);
  }

  const membership = await prisma.boardMember.findUnique({
    where: {
      boardId_userId: {
        boardId,
        userId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!membership) {
    return null;
  }

  return mapRole(membership.role);
}

export async function hasBoardPermissionDb(
  boardId: string,
  userId: string,
  requiredRole: BoardRole,
): Promise<boolean> {
  const role = await getUserBoardRoleDb(boardId, userId);
  if (!role) {
    return false;
  }

  return ROLE_WEIGHT[role] >= ROLE_WEIGHT[requiredRole];
}

export async function assertBoardPermissionDb(
  boardId: string,
  userId: string | null | undefined,
  requiredRole: BoardRole,
): Promise<void> {
  if (isTestRuntime()) {
    assertBoardPermission(boardId, userId, requiredRole);
    return;
  }

  if (!userId) {
    unauthorized('Authentication required');
  }

  const allowed = await hasBoardPermissionDb(boardId, userId, requiredRole);
  if (!allowed) {
    forbidden('Insufficient permissions');
  }
}
