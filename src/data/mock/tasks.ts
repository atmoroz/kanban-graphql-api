import { TaskPriority } from '../../types/task';

export type TaskRecord = {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  assigneeId?: string | null;
  position: number;
  statusId?: string | null;
  labelIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

export const tasks: TaskRecord[] = [];
