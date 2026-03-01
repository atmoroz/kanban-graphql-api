import { GraphQLError } from 'graphql';

export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  CONFLICT = 'CONFLICT',
}

type ApiErrorOptions = {
  code: ErrorCode;
  message: string;
  entity?: string;
  reason?: string;
};

export function throwApiError({
  code,
  message,
  entity,
  reason,
}: ApiErrorOptions): never {
  throw new GraphQLError(message, {
    extensions: {
      code,
      entity,
      reason,
    },
  });
}

export function unauthorized(message: string): never {
  throw new GraphQLError(message, {
    extensions: { code: 'UNAUTHORIZED' },
  });
}

export const forbidden = (message = 'Forbidden', entity?: string) =>
  throwApiError({
    code: ErrorCode.FORBIDDEN,
    message,
    entity,
  });

export function notFound(entity: string): never {
  throw new GraphQLError(`${entity} not found`, {
    extensions: {
      code: ErrorCode.NOT_FOUND,
      entity,
    },
  });
}

export function validationFailed(message: string, reason?: string): never {
  throw new GraphQLError(message, {
    extensions: {
      code: ErrorCode.VALIDATION_FAILED,
      reason,
    },
  });
}

export const conflict = (message: string, entity?: string) =>
  throwApiError({
    code: ErrorCode.CONFLICT,
    message,
    entity,
  });
