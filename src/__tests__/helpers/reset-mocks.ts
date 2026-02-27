import {
  activities,
  boardMembers,
  boards,
  columns,
  labels,
  pendingInvites,
  statuses,
  tasks,
  users,
} from '../../data/mock';

export function resetInMemoryState(): void {
  activities.length = 0;
  boardMembers.length = 0;
  boards.length = 0;
  columns.length = 0;
  labels.length = 0;
  pendingInvites.length = 0;
  statuses.length = 0;
  tasks.length = 0;
  users.length = 0;
}

