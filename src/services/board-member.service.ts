import {
  addBoardMember,
  findBoardMember,
  listBoardMembers,
  removeBoardMember as removeMemberRecord,
  updateBoardMemberRole as updateMemberRoleRecord,
} from '../data/mock';
import { BoardRole } from '../graphql/schema/types/board-role';
import { assertBoardPermissionDb } from '../lib/permissions-db';
import { conflict, notFound, forbidden } from '../lib/errors';
import { prisma } from '../lib/prisma';

/* ===== Invite ===== */

export async function inviteBoardMember(input: {
  boardId: string;
  actorUserId: string;
  userId: string;
  role: BoardRole;
}) {
  await assertBoardPermissionDb(
    input.boardId,
    input.actorUserId,
    BoardRole.ADMIN,
  );

  const existing = await prisma.boardMember.findUnique({
    where: {
      boardId_userId: {
        boardId: input.boardId,
        userId: input.userId,
      },
    },
  });
  if (existing) {
    conflict('User is already a board member');
  }

  const created = await prisma.boardMember.create({
    data: {
      boardId: input.boardId,
      userId: input.userId,
      role: input.role,
    },
  });

  if (!findBoardMember(input.boardId, input.userId)) {
    addBoardMember({
      boardId: input.boardId,
      userId: input.userId,
      role: input.role,
    });
  }

  return {
    boardId: input.boardId,
    userId: input.userId,
    role: created.role as BoardRole,
  };
}

/* ===== Update role ===== */

export async function updateBoardMemberRole(input: {
  boardId: string;
  actorUserId: string;
  userId: string;
  role: BoardRole;
}) {
  await assertBoardPermissionDb(
    input.boardId,
    input.actorUserId,
    BoardRole.OWNER,
  );

  const member = await prisma.boardMember.findUnique({
    where: {
      boardId_userId: {
        boardId: input.boardId,
        userId: input.userId,
      },
    },
  });
  if (!member) {
    notFound('BoardMember');
  }

  if (member.role === BoardRole.OWNER) {
    forbidden('Cannot change role of board owner');
  }

  const updated = await prisma.boardMember.update({
    where: {
      boardId_userId: {
        boardId: input.boardId,
        userId: input.userId,
      },
    },
    data: {
      role: input.role,
    },
  });

  const mock = findBoardMember(input.boardId, input.userId);
  if (!mock) {
    addBoardMember({
      boardId: input.boardId,
      userId: input.userId,
      role: input.role,
    });
  } else {
    updateMemberRoleRecord(input.boardId, input.userId, input.role);
  }

  return {
    boardId: updated.boardId,
    userId: updated.userId,
    role: updated.role as BoardRole,
  };
}

/* ===== Remove ===== */

export async function removeBoardMember(input: {
  boardId: string;
  actorUserId: string;
  userId: string;
}) {
  await assertBoardPermissionDb(
    input.boardId,
    input.actorUserId,
    BoardRole.ADMIN,
  );

  const member = await prisma.boardMember.findUnique({
    where: {
      boardId_userId: {
        boardId: input.boardId,
        userId: input.userId,
      },
    },
  });
  if (!member) {
    notFound('BoardMember');
  }

  if (member.role === BoardRole.OWNER) {
    forbidden('Cannot remove board owner');
  }

  await prisma.boardMember.delete({
    where: {
      boardId_userId: {
        boardId: input.boardId,
        userId: input.userId,
      },
    },
  });

  removeMemberRecord(input.boardId, input.userId);
  return true;
}

/* ===== List ===== */

export async function getBoardMembers(input: {
  boardId: string;
  actorUserId: string;
}) {
  await assertBoardPermissionDb(
    input.boardId,
    input.actorUserId,
    BoardRole.VIEWER,
  );

  const members = await prisma.boardMember.findMany({
    where: {
      boardId: input.boardId,
    },
  });

  const existingMockMembers = listBoardMembers(input.boardId);
  existingMockMembers.forEach(m => removeMemberRecord(m.boardId, m.userId));
  members.forEach(member => {
    addBoardMember({
      boardId: member.boardId,
      userId: member.userId,
      role: member.role as BoardRole,
    });
  });

  return members.map(member => ({
    boardId: member.boardId,
    userId: member.userId,
    role: member.role as BoardRole,
  }));
}
