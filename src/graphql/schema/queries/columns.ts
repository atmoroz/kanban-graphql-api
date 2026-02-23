export const columnQueries = `
    extend type Query {
       columns(boardId: ID!): [Column!]!
    }
`;
