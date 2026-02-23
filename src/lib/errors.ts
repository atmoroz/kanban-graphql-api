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

export const unauthorized = (message = 'Unauthorized') =>
  throwApiError({
    code: ErrorCode.UNAUTHORIZED,
    message,
  });

export const forbidden = (message = 'Forbidden', entity?: string) =>
  throwApiError({
    code: ErrorCode.FORBIDDEN,
    message,
    entity,
  });

export const notFound = (entity: string, message?: string) =>
  throwApiError({
    code: ErrorCode.NOT_FOUND,
    message: message ?? `${entity} not found`,
    entity,
  });

export const validationFailed = (message: string, reason?: string) =>
  throwApiError({
    code: ErrorCode.VALIDATION_FAILED,
    message,
    reason,
  });

export const conflict = (message: string, entity?: string) =>
  throwApiError({
    code: ErrorCode.CONFLICT,
    message,
    entity,
  });
