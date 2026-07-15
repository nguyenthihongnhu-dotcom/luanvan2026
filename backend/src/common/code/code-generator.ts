import { randomUUID } from 'node:crypto';

export function buildUniqueCode(
  prefix: string,
  reference: string | number,
): string {
  const uuid = randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase();

  return `${prefix}-${reference}-${uuid}`.slice(0, 80);
}
