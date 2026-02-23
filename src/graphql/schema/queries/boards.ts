export const boardQueries = `
    extend type Query {
        board(id: ID!): Board
        boards(
            first: Int
            after: String
            last: Int
            before: String
            visibility: BoardVisibility
        ): BoardConnection!
    }
`;
