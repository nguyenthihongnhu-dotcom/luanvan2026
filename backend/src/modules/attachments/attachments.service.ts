import type { AttachmentsFilters, AttachmentsRow } from './attachments.model';
import { findAttachments as findAttachmentsRepository } from './attachments.repository';

export async function listAttachments(
  filters: AttachmentsFilters,
): Promise<AttachmentsRow[]> {
  return findAttachmentsRepository(filters);
}
