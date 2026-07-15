import type { ZodError, ZodType } from 'zod';
import { HttpError } from '../http';

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
}

export function validateInput<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new HttpError(400, formatZodError(result.error), 'VALIDATION_ERROR');
  }

  return result.data;
}
