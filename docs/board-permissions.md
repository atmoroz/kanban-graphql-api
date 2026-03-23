"""
Permissions available for the current user inside a board.
These permissions are derived from the user's role in the board.
"""
type BoardPermissions {
  moveColumn: Boolean!
  moveCard: Boolean!

  createColumn: Boolean!
  createTask: Boolean!

  updateTask: Boolean!
  deleteTask: Boolean!

  manageLabels: Boolean!

  inviteMember: Boolean!
  manageBoardMembers: Boolean!
}

Board Type

Додаємо `permissions` всередину `Board`.
type Board {
  id: ID!
  title: String!
  description: String
  visibility: BoardVisibility!

  createdAt: DateTime!
  updatedAt: DateTime!

  permissions: BoardPermissions!
}

Query Example
query Board($id: ID!) {
  board(id: $id) {
    id
    title

    permissions {
      moveColumn
      moveCard
      createColumn
      createTask
      updateTask
      deleteTask
      manageLabels
      inviteMember
      manageBoardMembers
    }
  }
}

Приклад логіки на бекенді. Потрібно зробити на основі тих обмежень, які у нас є
function buildBoardPermissions(role: BoardRole): BoardPermissions {
  switch (role) {
    case "ADMIN":
      return {
        moveColumn: true,
        moveCard: true,
        createColumn: true,
        createTask: true,
        updateTask: true,
        deleteTask: true,
        manageLabels: true,
        inviteMember: true,
        manageBoardMembers: true,
      }

    case "MEMBER":
      return {
        moveColumn: false,
        moveCard: true,
        createColumn: false,
        createTask: true,
        updateTask: true,
        deleteTask: false,
        manageLabels: false,
        inviteMember: false,
        manageBoardMembers: false,
      }
  }
}