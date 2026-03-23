import {
  addBoardMember,
  createPendingInvite,
  findBoardMember,
  findPendingInviteByBoardAndEmail,
  findUserByEmail,
  findUserById,
  listPendingInvitesByBoard,
  listPendingInvitesByEmail,
  markInviteAccepted,
  markInviteEmailSent,
  PendingInviteRecord,
  pendingInvites,
} from '../data/mock';
import { BoardRole } from '../graphql/schema/types/board-role';
import { conflict, forbidden } from '../lib/errors';
import { assertBoardPermission } from '../lib/permissions';
import { assertBoardPermissionDb } from '../lib/permissions-db';
import { getBoardById, getBoardByIdPersisted } from './board.service';
import { sendInviteEmail } from './email.service';
import { prisma } from '../lib/prisma';

function isTestRuntime(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}

function toPendingInviteRecord(invite: {
  id: string;
  boardId: string;
  email: string;
  role: string;
  invitedByUserId: string;
  createdAt: Date;
  status: 'PENDING' | 'ACCEPTED';
  acceptedAt: Date | null;
  emailSentAt: Date | null;
}): PendingInviteRecord {
  return {
    id: invite.id,
    boardId: invite.boardId,
    email: invite.email,
    role: invite.role as BoardRole,
    invitedByUserId: invite.invitedByUserId,
    createdAt: invite.createdAt,
    status: invite.status,
    acceptedAt: invite.acceptedAt ?? undefined,
    emailSentAt: invite.emailSentAt ?? undefined,
  };
}

function upsertMockPendingInvite(invite: PendingInviteRecord): PendingInviteRecord {
  const existing = pendingInvites.find(item => item.id === invite.id);
  if (existing) {
    existing.boardId = invite.boardId;
    existing.email = invite.email;
    existing.role = invite.role;
    existing.invitedByUserId = invite.invitedByUserId;
    existing.createdAt = invite.createdAt;
    existing.status = invite.status;
    existing.acceptedAt = invite.acceptedAt;
    existing.emailSentAt = invite.emailSentAt;
    return existing;
  }

  pendingInvites.push(invite);
  return invite;
}

function replaceMockPendingInvitesByBoard(
  boardId: string,
  invites: PendingInviteRecord[],
): void {
  for (let i = pendingInvites.length - 1; i >= 0; i--) {
    if (pendingInvites[i].boardId === boardId) {
      pendingInvites.splice(i, 1);
    }
  }

  invites.forEach(invite => pendingInvites.push(invite));
}

export async function inviteByEmail(input: {
  boardId: string;
  email: string;
  role: BoardRole;
  invitedByUserId: string;
}): Promise<PendingInviteRecord> {
  if (isTestRuntime()) {
    const board = getBoardById(input.boardId);
    assertBoardPermission(input.boardId, input.invitedByUserId, BoardRole.ADMIN);

    if (input.role === BoardRole.OWNER) {
      forbidden('Cannot invite with OWNER role');
    }

    const normalizedEmail = input.email.toLowerCase().trim();
    const existingPending = findPendingInviteByBoardAndEmail(
      input.boardId,
      normalizedEmail,
    );
    if (existingPending) {
      conflict('Pending invite already exists for this email and board');
    }

    const invitedUser = findUserByEmail(normalizedEmail);
    const invite = createPendingInvite({
      boardId: input.boardId,
      email: normalizedEmail,
      role: input.role,
      invitedByUserId: input.invitedByUserId,
      status: invitedUser ? 'ACCEPTED' : 'PENDING',
    });

    if (invitedUser) {
      if (!findBoardMember(input.boardId, invitedUser.id)) {
        addBoardMember({
          boardId: input.boardId,
          userId: invitedUser.id,
          role: input.role,
        });
      }
      return invite;
    }

    const inviter = findUserById(input.invitedByUserId);

    try {
      await sendInviteEmail({
        toEmail: normalizedEmail,
        boardTitle: board.title,
        role: input.role,
        inviterName: inviter?.name,
      });
      markInviteEmailSent(invite.id);
    } catch {
      // Keep invite as PENDING even when provider call fails.
    }

    return invite;
  }

  const board = await getBoardByIdPersisted(input.boardId);
  await assertBoardPermissionDb(
    input.boardId,
    input.invitedByUserId,
    BoardRole.ADMIN,
  );

  if (input.role === BoardRole.OWNER) {
    forbidden('Cannot invite with OWNER role');
  }

  const normalizedEmail = input.email.toLowerCase().trim();
  const existingPending = await prisma.pendingInvite.findFirst({
    where: {
      boardId: input.boardId,
      email: normalizedEmail,
      status: 'PENDING',
    },
  });

  if (existingPending) {
    conflict('Pending invite already exists for this email and board');
  }

  const invitedUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
    },
  });

  let created = await prisma.pendingInvite.create({
    data: {
      boardId: input.boardId,
      email: normalizedEmail,
      role: input.role,
      invitedByUserId: input.invitedByUserId,
      status: invitedUser ? 'ACCEPTED' : 'PENDING',
      acceptedAt: invitedUser ? new Date() : null,
    },
  });

  if (invitedUser) {
    await prisma.boardMember.upsert({
      where: {
        boardId_userId: {
          boardId: input.boardId,
          userId: invitedUser.id,
        },
      },
      create: {
        boardId: input.boardId,
        userId: invitedUser.id,
        role: input.role,
      },
      update: {
        role: input.role,
      },
    });

    if (!findBoardMember(input.boardId, invitedUser.id)) {
      addBoardMember({
        boardId: input.boardId,
        userId: invitedUser.id,
        role: input.role,
      });
    }

    return upsertMockPendingInvite(toPendingInviteRecord(created));
  }

  const inviter = await prisma.user.findUnique({
    where: {
      id: input.invitedByUserId,
    },
    select: {
      name: true,
    },
  });

  try {
    await sendInviteEmail({
      toEmail: normalizedEmail,
      boardTitle: board.title,
      role: input.role,
      inviterName: inviter?.name ?? undefined,
    });

    created = await prisma.pendingInvite.update({
      where: {
        id: created.id,
      },
      data: {
        emailSentAt: new Date(),
      },
    });
  } catch {
    // Keep invite as PENDING even when provider call fails.
  }

  return upsertMockPendingInvite(toPendingInviteRecord(created));
}

export async function getPendingInvites(input: {
  boardId: string;
  actorUserId: string;
}): Promise<PendingInviteRecord[]> {
  if (isTestRuntime()) {
    getBoardById(input.boardId);
    assertBoardPermission(input.boardId, input.actorUserId, BoardRole.ADMIN);
    return listPendingInvitesByBoard(input.boardId);
  }

  await getBoardByIdPersisted(input.boardId);
  await assertBoardPermissionDb(input.boardId, input.actorUserId, BoardRole.ADMIN);

  const invites = await prisma.pendingInvite.findMany({
    where: {
      boardId: input.boardId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const mapped = invites.map(toPendingInviteRecord);
  replaceMockPendingInvitesByBoard(input.boardId, mapped);
  return mapped;
}

/**
 * Public read-only access (no auth): використовується тільки для board.visibility === PUBLIC.
 */
export async function getPendingInvitesPublic(input: {
  boardId: string;
}): Promise<PendingInviteRecord[]> {
  if (isTestRuntime()) {
    const board = getBoardById(input.boardId);
    if (board.visibility !== 'PUBLIC') {
      forbidden('Authentication required');
    }
    return listPendingInvitesByBoard(input.boardId);
  }

  const board = await getBoardByIdPersisted(input.boardId);
  if (board.visibility !== 'PUBLIC') {
    forbidden('Authentication required');
  }

  const invites = await prisma.pendingInvite.findMany({
    where: { boardId: input.boardId },
    orderBy: { createdAt: 'desc' },
  });

  const mapped = invites.map(toPendingInviteRecord);
  replaceMockPendingInvitesByBoard(input.boardId, mapped);
  return mapped;
}

/**
 * Public read-only by email: повертає тільки запрошення,
 * які належать до PUBLIC дошок.
 */
export async function getPendingInvitesByEmailPublic(input: {
  email: string;
}): Promise<PendingInviteRecord[]> {
  const normalizedEmail = input.email.toLowerCase().trim();

  if (isTestRuntime()) {
    const invites = listPendingInvitesByEmail(normalizedEmail);
    return invites.filter(inv => getBoardById(inv.boardId).visibility === 'PUBLIC');
  }

  const invites = await prisma.pendingInvite.findMany({
    where: { email: normalizedEmail },
    orderBy: { createdAt: 'desc' },
    include: {
      board: {
        select: { visibility: true },
      },
    },
  });

  const publicInvites = invites.filter(inv => inv.board.visibility === 'PUBLIC');
  const mapped = publicInvites.map(toPendingInviteRecord);
  mapped.forEach(invite => upsertMockPendingInvite(invite));
  return mapped;
}

export async function getPendingInvitesByEmail(input: {
  email: string;
  actorUserId: string;
}): Promise<PendingInviteRecord[]> {
  if (isTestRuntime()) {
    const actor = findUserById(input.actorUserId);

    if (!actor || actor.email.toLowerCase() !== input.email.toLowerCase()) {
      forbidden('Can only access invites for your own email');
    }

    return listPendingInvitesByEmail(input.email);
  }

  const actor = await prisma.user.findUnique({
    where: {
      id: input.actorUserId,
    },
    select: {
      email: true,
    },
  });

  const normalizedEmail = input.email.toLowerCase().trim();

  if (!actor || actor.email.toLowerCase() !== normalizedEmail) {
    forbidden('Can only access invites for your own email');
  }

  const invites = await prisma.pendingInvite.findMany({
    where: {
      email: normalizedEmail,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const mapped = invites.map(toPendingInviteRecord);
  mapped.forEach(invite => upsertMockPendingInvite(invite));
  return mapped;
}

export function acceptPendingInvitesForUser(input: {
  userId: string;
  email: string;
}): number | Promise<number> {
  if (isTestRuntime()) {
    const invites = listPendingInvitesByEmail(input.email).filter(
      invite => invite.status === 'PENDING',
    );

    invites.forEach(invite => {
      if (!findBoardMember(invite.boardId, input.userId)) {
        addBoardMember({
          boardId: invite.boardId,
          userId: input.userId,
          role: invite.role,
        });
      }

      markInviteAccepted(invite.id);
    });

    return invites.length;
  }

  const normalizedEmail = input.email.toLowerCase().trim();

  return prisma.pendingInvite
    .findMany({
      where: {
        email: normalizedEmail,
        status: 'PENDING',
      },
    })
    .then(async invites => {
      if (!invites.length) {
        return 0;
      }

      const acceptedAt = new Date();

      await prisma.$transaction(
        invites.flatMap(invite => [
          prisma.boardMember.upsert({
            where: {
              boardId_userId: {
                boardId: invite.boardId,
                userId: input.userId,
              },
            },
            create: {
              boardId: invite.boardId,
              userId: input.userId,
              role: invite.role,
            },
            update: {
              role: invite.role,
            },
          }),
          prisma.pendingInvite.update({
            where: {
              id: invite.id,
            },
            data: {
              status: 'ACCEPTED',
              acceptedAt,
            },
          }),
        ]),
      );

      invites.forEach(invite => {
        if (!findBoardMember(invite.boardId, input.userId)) {
          addBoardMember({
            boardId: invite.boardId,
            userId: input.userId,
            role: invite.role as BoardRole,
          });
        }

        upsertMockPendingInvite(
          toPendingInviteRecord({
            ...invite,
            acceptedAt,
            status: 'ACCEPTED',
          }),
        );
      });

      return invites.length;
    });
}
