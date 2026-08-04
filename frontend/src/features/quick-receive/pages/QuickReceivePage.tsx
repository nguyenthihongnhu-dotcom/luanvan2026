import React, { useEffect, useMemo, useRef, useState } from 'react';
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

type ScanTarget = 'product' | 'location';

/*
type DetectedBarcode = {
    rawValue: string;
};

type BarcodeDetectorInstance = {
    detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
};

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance;
*/

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

/*
function getBarcodeDetector(): BarcodeDetectorConstructor | null {
    return (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector ?? null;
}
*/

export default function QuickReceivePage() {
    const [form, setForm] = useState<FormState>(initialForm);
    const [createForm, setCreateForm] = useState<CreateProductForm>(initialCreateForm);
    const [missingSku, setMissingSku] = useState<string | null>(null);
    const [result, setResult] = useState<QuickReceiveResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCreatingProduct, setIsCreatingProduct] = useState(false);
    const [, setScanTarget] = useState<ScanTarget | null>(null);
    const [cameraMessage] = useState<string | null>(null);
    const [, setCameraStarting] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const frameRef = useRef<number | null>(null);
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

    function stopCameraScan() {
        if (frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setScanTarget(null);
        setCameraStarting(false);
    }

    /*
    async function startCameraScan(target: ScanTarget) {
        // Code quét QR camera đã bị tắt
    }
    */

    useEffect(() => {
        return () => stopCameraScan();
    }, []);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        const quantity = Number(form.quantity);

        if (!normalizedProduct) {
            setError('Quét QR sản phẩm hoặc nhập SKU trước.');
            return;
        }

        if (!normalizedLocation) {
            setError('Quét QR vị trí kho hoặc nhập mã vị trí trước.');
            return;
        }

        if (!Number.isFinite(quantity) || quantity <= 0) {
            setError('Nhập số lượng lớn hơn 0.');
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
                setError('SKU chưa có trong hệ thống. Tạo sản phẩm mới để tiếp tục nhập kho.');
            } else {
                setError(getHttpErrorMessage(err, 'Không nhập nhanh được hàng vào kho'));
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleCreateProduct(event: React.FormEvent) {
        event.preventDefault();
        if (!createForm.sku.trim() || !createForm.name.trim() || !createForm.category.trim()) {
            setError('Nhập SKU, tên sản phẩm và danh mục trước khi tạo mới.');
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
            setError('Đã tạo sản phẩm mới. Kiểm tra số lượng và bấm Xác nhận nhập kho.');
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, 'Không tạo được sản phẩm mới'));
        } finally {
            setIsCreatingProduct(false);
        }
    }

    return (
        <DashboardLayout>
            <div className="mx-auto flex max-w-5xl flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Nhập hàng nhanh bằng QR</h1>
                        <p className="text-sm text-gray-500">Quét QR sản phẩm, quét vị trí kho, nhập số lượng rồi xác nhận.</p>
                    </div>
                    {result && <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">Đã ghi {result.transactionCode}</span>}
                </div>

                {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
                {cameraMessage && <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">{cameraMessage}</div>}

                {/* Camera quét QR đã bị tắt
                {scanTarget && (
                    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                            <div>
                                <h2 className="text-sm font-bold text-gray-800">Camera quét QR</h2>
                                <p className="text-xs text-gray-500">Đang quét {scanTarget === 'product' ? 'sản phẩm / SKU' : 'vị trí kho'}.</p>
                            </div>
                            <button type="button" onClick={stopCameraScan} className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                                <CloseOutlined />
                                Tắt cam
                            </button>
                        </div>
                        <div className="bg-slate-950 p-3">
                            <video ref={videoRef} className="mx-auto aspect-video max-h-80 w-full rounded-md object-cover" muted playsInline />
                            {isCameraStarting && <p className="mt-2 text-center text-xs text-white">Đang mở camera...</p>}
                        </div>
                    </section>
                )}
                */}

                {missingSku && (
                    <form onSubmit={(event) => void handleCreateProduct(event)} className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h2 className="text-base font-bold text-amber-900">Tạo sản phẩm mới</h2>
                                <p className="text-sm text-amber-700">SKU vừa quét chưa có trong DB. Tạo nhanh sản phẩm rồi tiếp tục nhập kho.</p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">{missingSku}</span>
                        </div>
                        <div className="grid gap-3 md:grid-cols-5">
                            <input value={createForm.sku} onChange={(event) => setCreateForm((current) => ({ ...current, sku: event.target.value }))} className="rounded-md border border-amber-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" placeholder="SKU" />
                            <input value={createForm.name} onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))} className="rounded-md border border-amber-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500 md:col-span-2" placeholder="Tên sản phẩm" />
                            <input value={createForm.category} onChange={(event) => setCreateForm((current) => ({ ...current, category: event.target.value }))} className="rounded-md border border-amber-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" placeholder="Danh mục" />
                            <input type="number" min="0" value={createForm.minStock} onChange={(event) => setCreateForm((current) => ({ ...current, minStock: event.target.value }))} className="rounded-md border border-amber-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" placeholder="Tồn tối thiểu" />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <button type="submit" disabled={isCreatingProduct} className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60">{isCreatingProduct ? 'Đang tạo...' : 'Tạo sản phẩm'}</button>
                            <button type="button" onClick={() => { setMissingSku(null); setError(null); }} className="rounded-md border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100">Bỏ qua</button>
                        </div>
                    </form>
                )}

                <form onSubmit={(event) => void handleSubmit(event)} className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:grid-cols-[1.2fr_1fr]">
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">QR sản phẩm / SKU</label>
                            <div className="flex gap-2">
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
                                    placeholder="Quét QR sản phẩm hoặc nhập SKU, ví dụ SUA-FRISO-4"
                                    className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                                />
                                {/* <button type="button" onClick={() => void startCameraScan('product')} className="inline-flex items-center gap-2 rounded-md border border-pink-200 bg-pink-50 px-3 py-2 text-sm font-semibold text-pink-700 hover:bg-pink-100">
                                    <CameraOutlined />
                                    Bật cam
                                </button> */}
                            </div>
                            {normalizedProduct && <p className="mt-1 text-xs font-semibold text-pink-700">Nhận diện: {normalizedProduct}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">QR vị trí kho / mã vị trí</label>
                            <div className="flex gap-2">
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
                                    placeholder="Quét QR vị trí hoặc nhập HCM01-A-A02-01"
                                    className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                                />
                                {/* <button type="button" onClick={() => void startCameraScan('location')} className="inline-flex items-center gap-2 rounded-md border border-pink-200 bg-pink-50 px-3 py-2 text-sm font-semibold text-pink-700 hover:bg-pink-100">
                                    <CameraOutlined />
                                    Bật cam
                                </button> */}
                            </div>
                            {normalizedLocation && <p className="mt-1 text-xs font-semibold text-pink-700">Vị trí: {normalizedLocation}</p>}
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Số lượng</label>
                                <input ref={quantityInputRef} type="number" min="0.001" step="0.001" value={form.quantity} onChange={(event) => updateField('quantity', event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Lô hàng</label>
                                <input value={form.lotNumber} onChange={(event) => updateField('lotNumber', event.target.value)} placeholder="Nếu có" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Hạn dùng</label>
                                <input type="date" value={form.expiryDate} onChange={(event) => updateField('expiryDate', event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Ghi chú</label>
                            <textarea value={form.note} onChange={(event) => updateField('note', event.target.value)} rows={3} placeholder="Nguồn nhập, lý do, người giao..." className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button type="submit" disabled={isSubmitting} className="rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-60">{isSubmitting ? 'Đang nhập kho...' : 'Xác nhận nhập kho'}</button>
                            <button type="button" onClick={() => { setForm(initialForm); setResult(null); setError(null); setMissingSku(null); }} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Xóa form</button>
                        </div>
                    </div>

                    <aside className="rounded-lg border border-pink-100 bg-pink-50/40 p-4">
                        <h2 className="text-sm font-bold uppercase text-pink-700">Kết quả gần nhất</h2>
                        {result ? (
                            <dl className="mt-3 space-y-2 text-sm">
                                <div><dt className="text-xs font-semibold uppercase text-gray-500">Mã giao dịch</dt><dd className="font-bold text-gray-900">{result.transactionCode}</dd></div>
                                <div><dt className="text-xs font-semibold uppercase text-gray-500">Sản phẩm</dt><dd className="font-semibold text-gray-900">{result.sku} - {result.variantName || result.productName}</dd></div>
                                <div><dt className="text-xs font-semibold uppercase text-gray-500">Vị trí</dt><dd className="font-semibold text-gray-900">{result.locationCode}</dd></div>
                                <div className="grid grid-cols-3 gap-2 rounded-md bg-white p-3 text-center shadow-sm">
                                    <div><dt className="text-[10px] font-semibold uppercase text-gray-400">Trước</dt><dd className="font-bold text-gray-900">{formatNumber(result.quantityBefore)}</dd></div>
                                    <div><dt className="text-[10px] font-semibold uppercase text-gray-400">Nhập</dt><dd className="font-bold text-green-700">+{formatNumber(result.quantity)}</dd></div>
                                    <div><dt className="text-[10px] font-semibold uppercase text-gray-400">Sau</dt><dd className="font-bold text-gray-900">{formatNumber(result.quantityAfter)}</dd></div>
                                </div>
                                {result.lotNumber && <div><dt className="text-xs font-semibold uppercase text-gray-500">Lô</dt><dd className="font-semibold text-gray-900">{result.lotNumber}</dd></div>}
                            </dl>
                        ) : (
                            <p className="mt-3 text-sm text-gray-500">Chưa có lần nhập nào trong phiên này.</p>
                        )}
                    </aside>
                </form>
            </div>
        </DashboardLayout>
    );
}