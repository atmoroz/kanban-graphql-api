export const taskFilterTypes = `
  enum DueFilter {
    OVERDUE
    THIS_WEEK
    NO_DUE
  }

  enum TaskSortBy {
    CREATED_AT
    UPDATED_AT
    DUE_DATE
    PRIORITY
    TITLE
  }

  enum SortOrder {
    ASC
    DESC
  }
`;
