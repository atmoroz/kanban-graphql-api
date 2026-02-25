import { TaskRecord, tasks, columns } from '../data/mock';
import { paginateArray, PaginationArgs } from '../lib/pagination';
import { notFound } from '../lib/errors';

/* ===== Types ===== */

export type DueFilter = 'OVERDUE' | 'THIS_WEEK' | 'NO_DUE';

export type TaskSortBy =
  | 'CREATED_AT'
  | 'UPDATED_AT'
  | 'DUE_DATE'
  | 'PRIORITY'
  | 'TITLE';

export type SortOrder = 'ASC' | 'DESC';

export type TaskSearchArgs = {
  boardId: string;
  query?: string;
  statusIds?: string[];
  priority?: TaskRecord['priority'][];
  assigneeId?: string;
  dueFilter?: DueFilter;
  sortBy?: TaskSortBy;
  sortOrder?: SortOrder;
};

/* ===== Helpers ===== */
//SEARCH
function applySearch(tasks: TaskRecord[], query?: string): TaskRecord[] {
  if (!query) return tasks;

  const q = query.toLowerCase();

  return tasks.filter(
    t =>
      t.title.toLowerCase().includes(q) ||
      (t.description?.toLowerCase().includes(q) ?? false),
  );
}

//FILTERS
function applyFilters(tasks: TaskRecord[], args: TaskSearchArgs): TaskRecord[] {
  const now = new Date();

  return tasks.filter(task => {
    if (
      args.statusIds &&
      (!task.statusId || !args.statusIds.includes(task.statusId))
    ) {
      return false;
    }

    if (args.priority && !args.priority.includes(task.priority)) {
      return false;
    }

    if (args.assigneeId && task.assigneeId !== args.assigneeId) {
      return false;
    }

    if (args.dueFilter) {
      if (args.dueFilter === 'NO_DUE') {
        if (task.dueDate) return false;
      }

      if (args.dueFilter === 'OVERDUE') {
        if (!task.dueDate || task.dueDate >= now) return false;
      }

      if (args.dueFilter === 'THIS_WEEK') {
        if (!task.dueDate) return false;

        const weekFromNow = new Date();
        weekFromNow.setDate(now.getDate() + 7);

        if (task.dueDate < now || task.dueDate > weekFromNow) {
          return false;
        }
      }
    }

    return true;
  });
}

//SORTING
function applySort(
  tasks: TaskRecord[],
  sortBy: TaskSortBy = 'CREATED_AT',
  sortOrder: SortOrder = 'ASC',
): TaskRecord[] {
  const direction = sortOrder === 'ASC' ? 1 : -1;

  return [...tasks].sort((a, b) => {
    switch (sortBy) {
      case 'TITLE':
        return a.title.localeCompare(b.title) * direction;

      case 'PRIORITY': {
        const order: Record<string, number> = {
          HIGH: 3,
          MEDIUM: 2,
          LOW: 1,
        };
        const weight = (p?: TaskRecord['priority']) =>
          p != null ? order[p] ?? 0 : 0;
        return (weight(a.priority) - weight(b.priority)) * direction;
      }

      case 'DUE_DATE':
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return (a.dueDate.getTime() - b.dueDate.getTime()) * direction;

      case 'UPDATED_AT':
        return (a.updatedAt.getTime() - b.updatedAt.getTime()) * direction;

      case 'CREATED_AT':
      default:
        return (a.createdAt.getTime() - b.createdAt.getTime()) * direction;
    }
  });
}

/* ===== Public API ===== */

export function searchTasksByBoard(
  args: TaskSearchArgs,
  pagination: PaginationArgs,
) {
  const boardColumns = columns.filter(c => c.boardId === args.boardId);
  if (boardColumns.length === 0) notFound('Board');

  const columnIds = boardColumns.map(c => c.id);

  let result = tasks.filter(t => columnIds.includes(t.columnId));

  result = applySearch(result, args.query);
  result = applyFilters(result, args);
  result = applySort(result, args.sortBy, args.sortOrder);

  return paginateArray(result, pagination);
}
