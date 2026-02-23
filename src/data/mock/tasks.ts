export type TaskRecord = {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: Date;
  assigneeId?: string | null;
  position: number;
  statusId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const tasks: TaskRecord[] = [];
