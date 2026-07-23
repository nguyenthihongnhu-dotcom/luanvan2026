import { httpClient, unwrapData } from '@/shared/services/httpClient';

export interface AttachmentItem {
    id: number;
    entity_type: string;
    entity_id: number;
    file_name: string;
    file_url: string;
    mime_type: string | null;
    file_size: number | null;
    uploaded_by: number;
    created_at: string;
}

export async function listAttachments(search = ''): Promise<AttachmentItem[]> {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    const response = await httpClient.get<{ data: AttachmentItem[] }>(`/attachments${params.toString() ? `?${params.toString()}` : ''}`);
    return unwrapData(response);
}

export const attachmentService = { listAttachments };
