import { useMemo, useRef, useState } from 'react';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import { getHttpErrorMessage, HttpError, httpClient } from '@/shared/services/httpClient';
import { quickReceiveService } from '@/features/quick-receive/services/quickReceiveService';
import type { QuickReceiveResult } from '@/features/quick-receive/services/quickReceiveService';

type CreateProductForm = {
    sku: string;
    name: string;
    category: string;
    minStock: string;
    expiryDate: string;
};

type FormState = {
    productScan: string;
    locationScan: string;
    quantity: string;
    lotNumber: string;
    expiryDate: string;
    note: string;
};

const initialForm: FormState = {
    productScan: '',
    locationScan: '',
    quantity: '',
    lotNumber: '',
    expiryDate: '',
    note: '',
};

const initialCreateForm: CreateProductForm = {
    sku: '',
    name: '',
    category: '',
    minStock: '0',
    expiryDate: '',
};

function normalizeScanValue(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return '';

    try {
        const parsed = JSON.parse(trimmed) as { sku?: unknown; code?: unknown; id?: unknown };
        const candidate = parsed.sku ?? parsed.code ?? parsed.id;
        return candidate == null ? trimmed : String(candidate).trim();
    } catch {
        return trimmed;
    }
}

function getBackendErrorCode(error: unknown): string | undefined {
    if (!(error instanceof HttpError)) return undefined;
    const payload = error.payload as { error?: { code?: string } } | undefined;
    return payload?.error?.code;
}

async function createCatalogProduct(input: CreateProductForm): Promise<void> {
    await httpClient.post('/catalog/products', {
        sku: input.sku,
        name: input.name,
        category: input.category,
        stock: 0,
        minStock: Number(input.minStock || 0),
        expiryDate: input.expiryDate || undefined,
    });
}

function formatNumber(value: number): string {
    return Number(value ?? 0).toLocaleString('vi-VN');
}

export default function QuickReceivePage() {
    const [form, setForm] = useState<FormState>(initialForm);
    const [createForm, setCreateForm] = useState<CreateProductForm>(initialCreateForm);
    const [missingSku, setMissingSku] = useState<string | null>(null);
    const [result, setResult] = useState<QuickReceiveResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCreatingProduct, setIsCreatingProduct] = useState(false);
    const locationInputRef = useRef<HTMLInputElement>(null);
    const quantityInputRef = useRef<HTMLInputElement>(null);

    const normalizedProduct = useMemo(() => normalizeScanValue(form.productScan), [form.productScan]);
    const normalizedLocation = useMemo(() => normalizeScanValue(form.locationScan), [form.locationScan]);

    function updateField(name: keyof FormState, value: string) {
        setForm((current) => ({ ...current, [name]: value }));
        setResult(null);
        setError(null);
        setMissingSku(null);
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        const quantity = Number(form.quantity);

        if (!normalizedProduct) {
            setError('Quet QR san pham hoac nhap SKU truoc.');
            return;
        }

        if (!normalizedLocation) {
            setError('Quet QR vi tri kho hoac nhap ma vi tri truoc.');
            return;
        }

        if (!Number.isFinite(quantity) || quantity <= 0) {
            setError('Nhap so luong lon hon 0.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const nextResult = await quickReceiveService.quickReceive({
                productScan: normalizedProduct,
                locationScan: normalizedLocation,
                quantity,
                lotNumber: form.lotNumber.trim() || undefined,
                expiryDate: form.expiryDate || undefined,
                note: form.note.trim() || undefined,
            });
            setResult(nextResult);
            setMissingSku(null);
            setForm((current) => ({ ...current, productScan: '', quantity: '', lotNumber: '', expiryDate: '', note: '' }));
        } catch (err) {
            console.error(err);
            if (getBackendErrorCode(err) === 'PRODUCT_NOT_FOUND') {
                const sku = normalizedProduct;
                setMissingSku(sku);
                setCreateForm({ sku, name: '', category: '', minStock: '0', expiryDate: form.expiryDate });
                setError('SKU chua co trong he thong. Tao san pham moi de tiep tuc nhap kho.');
            } else {
                setError(getHttpErrorMessage(err, 'Khong nhap nhanh duoc hang vao kho'));
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleCreateProduct(event: React.FormEvent) {
        event.preventDefault();
        if (!createForm.sku.trim() || !createForm.name.trim() || !createForm.category.trim()) {
            setError('Nhap SKU, ten san pham va danh muc truoc khi tao moi.');
            return;
        }

        setIsCreatingProduct(true);
        setError(null);
        try {
            const sku = createForm.sku.trim();
            await createCatalogProduct({
                ...createForm,
                sku,
                name: createForm.name.trim(),
                category: createForm.category.trim(),
            });
            setMissingSku(null);
            setForm((current) => ({ ...current, productScan: sku }));
            setError('Da tao san pham moi. Kiem tra so luong va bam Xac nhan nhap kho.');
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, 'Khong tao duoc san pham moi'));
        } finally {
            setIsCreatingProduct(false);
        }
    }

    return (
        <DashboardLayout>
            <div className="mx-auto flex max-w-5xl flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Nhap hang nhanh bang QR</h1>
                        <p className="text-sm text-gray-500">Quet QR san pham, quet vi tri kho, nhap so luong roi xac nhan.</p>
                    </div>
                    {result && <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">Da ghi {result.transactionCode}</span>}
                </div>

                {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

                {missingSku && (
                    <form onSubmit={(event) => void handleCreateProduct(event)} className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h2 className="text-base font-bold text-amber-900">Tao san pham moi</h2>
                                <p className="text-sm text-amber-700">SKU vua quet chua co trong DB. Tao nhanh san pham roi tiep tuc nhap kho.</p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">{missingSku}</span>
                        </div>
                        <div className="grid gap-3 md:grid-cols-5">
                            <input value={createForm.sku} onChange={(event) => setCreateForm((current) => ({ ...current, sku: event.target.value }))} className="rounded-md border border-amber-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" placeholder="SKU" />
                            <input value={createForm.name} onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))} className="rounded-md border border-amber-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500 md:col-span-2" placeholder="Ten san pham" />
                            <input value={createForm.category} onChange={(event) => setCreateForm((current) => ({ ...current, category: event.target.value }))} className="rounded-md border border-amber-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" placeholder="Danh muc" />
                            <input type="number" min="0" value={createForm.minStock} onChange={(event) => setCreateForm((current) => ({ ...current, minStock: event.target.value }))} className="rounded-md border border-amber-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" placeholder="Ton toi thieu" />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <button type="submit" disabled={isCreatingProduct} className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60">{isCreatingProduct ? 'Dang tao...' : 'Tao san pham'}</button>
                            <button type="button" onClick={() => { setMissingSku(null); setError(null); }} className="rounded-md border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100">Bo qua</button>
                        </div>
                    </form>
                )}

                <form onSubmit={(event) => void handleSubmit(event)} className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:grid-cols-[1.2fr_1fr]">
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">QR san pham / SKU</label>
                            <input
                                autoFocus
                                value={form.productScan}
                                onChange={(event) => updateField('productScan', event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && normalizedProduct) {
                                        event.preventDefault();
                                        locationInputRef.current?.focus();
                                    }
                                }}
                                placeholder="Quet QR san pham hoac nhap SKU, vi du SUA-FRISO-4"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                            />
                            {normalizedProduct && <p className="mt-1 text-xs font-semibold text-pink-700">Nhan dien: {normalizedProduct}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">QR vi tri kho / ma vi tri</label>
                            <input
                                ref={locationInputRef}
                                value={form.locationScan}
                                onChange={(event) => updateField('locationScan', event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && normalizedLocation) {
                                        event.preventDefault();
                                        quantityInputRef.current?.focus();
                                    }
                                }}
                                placeholder="Quet QR vi tri hoac nhap HCM01-A-A02-01"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                            />
                            {normalizedLocation && <p className="mt-1 text-xs font-semibold text-pink-700">Vi tri: {normalizedLocation}</p>}
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">So luong</label>
                                <input ref={quantityInputRef} type="number" min="0.001" step="0.001" value={form.quantity} onChange={(event) => updateField('quantity', event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Lo hang</label>
                                <input value={form.lotNumber} onChange={(event) => updateField('lotNumber', event.target.value)} placeholder="Neu co" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Han dung</label>
                                <input type="date" value={form.expiryDate} onChange={(event) => updateField('expiryDate', event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Ghi chu</label>
                            <textarea value={form.note} onChange={(event) => updateField('note', event.target.value)} rows={3} placeholder="Nguon nhap, ly do, nguoi giao..." className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button type="submit" disabled={isSubmitting} className="rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-60">{isSubmitting ? 'Dang nhap kho...' : 'Xac nhan nhap kho'}</button>
                            <button type="button" onClick={() => { setForm(initialForm); setResult(null); setError(null); setMissingSku(null); }} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Xoa form</button>
                        </div>
                    </div>

                    <aside className="rounded-lg border border-pink-100 bg-pink-50/40 p-4">
                        <h2 className="text-sm font-bold uppercase text-pink-700">Ket qua gan nhat</h2>
                        {result ? (
                            <dl className="mt-3 space-y-2 text-sm">
                                <div><dt className="text-xs font-semibold uppercase text-gray-500">Ma giao dich</dt><dd className="font-bold text-gray-900">{result.transactionCode}</dd></div>
                                <div><dt className="text-xs font-semibold uppercase text-gray-500">San pham</dt><dd className="font-semibold text-gray-900">{result.sku} - {result.variantName || result.productName}</dd></div>
                                <div><dt className="text-xs font-semibold uppercase text-gray-500">Vi tri</dt><dd className="font-semibold text-gray-900">{result.locationCode}</dd></div>
                                <div className="grid grid-cols-3 gap-2 rounded-md bg-white p-3 text-center shadow-sm">
                                    <div><dt className="text-[10px] font-semibold uppercase text-gray-400">Truoc</dt><dd className="font-bold text-gray-900">{formatNumber(result.quantityBefore)}</dd></div>
                                    <div><dt className="text-[10px] font-semibold uppercase text-gray-400">Nhap</dt><dd className="font-bold text-green-700">+{formatNumber(result.quantity)}</dd></div>
                                    <div><dt className="text-[10px] font-semibold uppercase text-gray-400">Sau</dt><dd className="font-bold text-gray-900">{formatNumber(result.quantityAfter)}</dd></div>
                                </div>
                                {result.lotNumber && <div><dt className="text-xs font-semibold uppercase text-gray-500">Lo</dt><dd className="font-semibold text-gray-900">{result.lotNumber}</dd></div>}
                            </dl>
                        ) : (
                            <p className="mt-3 text-sm text-gray-500">Chua co lan nhap nao trong phien nay.</p>
                        )}
                    </aside>
                </form>
            </div>
        </DashboardLayout>
    );
}