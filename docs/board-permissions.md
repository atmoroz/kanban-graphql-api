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

Добавляем permissions внутрь Board.
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

Пример логики на backend. нужно сделать на основании тех ограничений что у нас есть
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