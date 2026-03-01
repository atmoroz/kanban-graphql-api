export const userTypes = `
  type User {
    id: ID!
    email: String!
    name: String
    createdAt: DateTime!
  }

  type AuthPayload {
    user: User!
    token: String!
  }
`;
