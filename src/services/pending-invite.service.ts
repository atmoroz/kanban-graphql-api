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
} from '../data/mock';
import { BoardRole } from '../graphql/schema/types/board-role';
import { conflict, forbidden } from '../lib/errors';
import { assertBoardPermission } from '../lib/permissions';
import { getBoardById } from './board.service';
import { sendInviteEmail } from './email.service';

export async function inviteByEmail(input: {
  boardId: string;
  email: string;
  role: BoardRole;
  invitedByUserId: string;
}): Promise<PendingInviteRecord> {
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

export function getPendingInvites(input: {
  boardId: string;
  actorUserId: string;
}): PendingInviteRecord[] {
  getBoardById(input.boardId);
  assertBoardPermission(input.boardId, input.actorUserId, BoardRole.ADMIN);
  return listPendingInvitesByBoard(input.boardId);
}

export function getPendingInvitesByEmail(input: {
  email: string;
  actorUserId: string;
}): PendingInviteRecord[] {
  const actor = findUserById(input.actorUserId);

  if (!actor || actor.email.toLowerCase() !== input.email.toLowerCase()) {
    forbidden('Can only access invites for your own email');
  }

  return listPendingInvitesByEmail(input.email);
}

export function acceptPendingInvitesForUser(input: {
  userId: string;
  email: string;
}): number {
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

