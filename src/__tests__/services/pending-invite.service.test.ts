import { describe, expect, it } from 'vitest';
import { findBoardMember, pendingInvites, users } from '../../data/mock';
import { BoardRole } from '../../graphql/schema/types/board-role';
import { createBoard } from '../../services/board.service';
import { acceptPendingInvitesForUser, inviteByEmail } from '../../services/pending-invite.service';
import { createUser } from '../../data/mock/users';

describe('pending invite service', () => {
  it('creates PENDING invite for unknown email', async () => {
    const owner = createUser({
      email: 'owner@test.dev',
      passwordHash: 'hash',
      name: 'Owner',
    });
    const board = createBoard({
      title: 'Board',
      visibility: 'PRIVATE',
      ownerId: owner.id,
    });

    const invite = await inviteByEmail({
      boardId: board.id,
      email: 'new-user@test.dev',
      role: BoardRole.MEMBER,
      invitedByUserId: owner.id,
    });

    expect(invite.status).toBe('PENDING');
    expect(invite.email).toBe('new-user@test.dev');
    expect(invite.emailSentAt).toBeDefined();
    expect(pendingInvites).toHaveLength(1);
  });

  it('accepts pending invites when user appears', () => {
    const owner = createUser({
      email: 'owner@test.dev',
      passwordHash: 'hash',
      name: 'Owner',
    });
    const board = createBoard({
      title: 'Board',
      visibility: 'PRIVATE',
      ownerId: owner.id,
    });

    pendingInvites.push({
      id: 'inv-1',
      boardId: board.id,
      email: 'joiner@test.dev',
      role: BoardRole.MEMBER,
      invitedByUserId: owner.id,
      createdAt: new Date(),
      status: 'PENDING',
    });

    const joiner = createUser({
      email: 'joiner@test.dev',
      passwordHash: 'hash',
      name: 'Joiner',
    });

    const applied = acceptPendingInvitesForUser({
      userId: joiner.id,
      email: joiner.email,
    });

    expect(applied).toBe(1);
    expect(findBoardMember(board.id, joiner.id)?.role).toBe(BoardRole.MEMBER);
    expect(pendingInvites[0]?.status).toBe('ACCEPTED');
    expect(users).toHaveLength(2);
  });
});

