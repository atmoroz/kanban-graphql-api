import { GraphQLScalarType, Kind } from 'graphql';
import { validationFailed } from '../../lib/errors';

export const dateTimeResolver = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO-8601 DateTime scalar',
  serialize(value: unknown) {
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'string') {
      return value;
    }

    validationFailed('Invalid DateTime value');
  },
  parseValue(value: unknown) {
    const date = new Date(value as string);
    if (isNaN(date.getTime())) {
      validationFailed('Invalid DateTime input');
    }
    return date;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      const date = new Date(ast.value);
      if (isNaN(date.getTime())) {
        validationFailed('Invalid DateTime literal');
      }
      return date;
    }
    validationFailed('DateTime must be a string');
  },
});
