import { httpClient, unwrapData } from '@/shared/services/httpClient';

export type PartnerType = 'NCC' | 'KH';

export interface Partner {
    MaNCC: number;
    TenNCC: string;
    NguoiLienHe: string;
    Email: string;
    SoDienThoai: string;
    type: PartnerType;
}

type SupplierRow = {
    id: number;
    code: string;
    name: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
};

export type PartnerInput = Omit<Partner, 'MaNCC' | 'type'> & { code?: string };

function mapSupplier(row: SupplierRow): Partner {
    return {
        MaNCC: row.id,
        TenNCC: row.name,
        NguoiLienHe: row.contact_name ?? '',
        Email: row.email ?? '',
        SoDienThoai: row.phone ?? '',
        type: 'NCC',
    };
}

export async function listPartners(): Promise<Partner[]> {
    const response = await httpClient.get<{ data: SupplierRow[] }>('/suppliers');
    return unwrapData(response).map(mapSupplier);
}

export async function createPartner(input: PartnerInput): Promise<void> {
    await httpClient.post('/suppliers', {
        code: input.code,
        name: input.TenNCC,
        contactName: input.NguoiLienHe,
        email: input.Email || undefined,
        phone: input.SoDienThoai || undefined,
    });
}

export async function updatePartner(id: number, input: PartnerInput): Promise<void> {
    await httpClient.put(`/suppliers/${id}`, {
        code: input.code,
        name: input.TenNCC,
        contactName: input.NguoiLienHe,
        email: input.Email || undefined,
        phone: input.SoDienThoai || undefined,
    });
}

export async function deletePartner(id: number): Promise<void> {
    await httpClient.delete(`/suppliers/${id}`);
}

export const partnerService = { listPartners, createPartner, updatePartner, deletePartner };