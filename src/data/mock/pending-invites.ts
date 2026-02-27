import { randomUUID } from 'node:crypto';
import { BoardRole } from '../../graphql/schema/types/board-role';

export type InviteStatus = 'PENDING' | 'ACCEPTED';

export type PendingInviteRecord = {
  id: string;
  boardId: string;
  email: string;
  role: BoardRole;
  invitedByUserId: string;
  createdAt: Date;
  status: InviteStatus;
  acceptedAt?: Date;
  emailSentAt?: Date;
};

export const pendingInvites: PendingInviteRecord[] = [];

export function createPendingInvite(input: {
  boardId: string;
  email: string;
  role: BoardRole;
  invitedByUserId: string;
  status?: InviteStatus;
}): PendingInviteRecord {
  const invite: PendingInviteRecord = {
    id: randomUUID(),
    boardId: input.boardId,
    email: input.email.toLowerCase(),
    role: input.role,
    invitedByUserId: input.invitedByUserId,
    createdAt: new Date(),
    status: input.status ?? 'PENDING',
  };

  if (invite.status === 'ACCEPTED') {
    invite.acceptedAt = new Date();
  }

  pendingInvites.push(invite);
  return invite;
}

export function listPendingInvitesByBoard(
  boardId: string,
): PendingInviteRecord[] {
  return pendingInvites
    .filter(i => i.boardId === boardId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function listPendingInvitesByEmail(
  email: string,
): PendingInviteRecord[] {
  const normalized = email.toLowerCase();

  return pendingInvites
    .filter(i => i.email === normalized)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function findPendingInviteByBoardAndEmail(
  boardId: string,
  email: string,
): PendingInviteRecord | undefined {
  const normalized = email.toLowerCase();

  return pendingInvites.find(
    i => i.boardId === boardId && i.email === normalized && i.status === 'PENDING',
  );
}

export function markInviteAccepted(inviteId: string): PendingInviteRecord | null {
  const invite = pendingInvites.find(i => i.id === inviteId);
  if (!invite) {
    return null;
  }

  invite.status = 'ACCEPTED';
  invite.acceptedAt = new Date();
  return invite;
}

export function markInviteEmailSent(inviteId: string): PendingInviteRecord | null {
  const invite = pendingInvites.find(i => i.id === inviteId);
  if (!invite) {
    return null;
  }

  invite.emailSentAt = new Date();
  return invite;
}

