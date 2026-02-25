export type ColumnRecord = {
  id: string;
  boardId: string;
  title: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  statusId: string;
};

export const columns: ColumnRecord[] = [];
