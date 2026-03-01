export const columnMutations = `
    extend type Mutation {
        createColumn(
            boardId: ID!
            title: String!
        ): Column!

        updateColumn(
            id: ID!
            title: String!
        ): Column!

        deleteColumn(id: ID!): Boolean!

        moveColumn(
            id: ID!
            newPosition: Int!
        ): [Column!]!
    }
`;
