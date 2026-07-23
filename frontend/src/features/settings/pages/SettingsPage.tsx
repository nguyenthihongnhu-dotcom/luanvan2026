import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import Tablelayout from '@/shared/ui/Table/TableLayout';
import type { ColumnProps } from '@/shared/ui/Table/types';
import { settingService } from '@/features/settings/services/settingService';
import type { AppSetting } from '@/features/settings/services/settingService';
import { usePermissions } from '@/shared/auth/usePermissions';

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function formatJson(value: unknown): string {
    if (typeof value === 'string') return value;
    return JSON.stringify(value, null, 2);
}

export default function SettingsPage() {
    const { hasPermission } = usePermissions();
    const canUpdateSettings = hasPermission('settings:update');
    const [rows, setRows] = useState<AppSetting[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingSetting, setEditingSetting] = useState<AppSetting | null>(null);
    const [settingValueText, setSettingValueText] = useState('');
    const [description, setDescription] = useState('');

    async function loadRows(search = searchTerm) {
        setIsLoading(true);
        setError(null);
        try {
            setRows(await settingService.listSettings(search));
        } catch (err) {
            console.error(err);
            setError('Không tải được cấu hình hệ thống từ backend.');
        } finally {
            setIsLoading(false);
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load is mount-only; filters reload via explicit user action.
    useEffect(() => { void loadRows(''); }, []);

    function openEdit(setting: AppSetting) {
        setEditingSetting(setting);
        setSettingValueText(formatJson(setting.setting_value));
        setDescription(setting.description ?? '');
        setError(null);
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        if (!editingSetting) return;

        let parsedValue: unknown;
        try {
            parsedValue = JSON.parse(settingValueText);
        } catch {
            setError('Giá trị cấu hình phải là JSON hợp lệ. Ví dụ chuỗi cần đặt trong dấu nháy kép.');
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            await settingService.updateSetting(editingSetting.id, {
                settingValue: parsedValue,
                description: description.trim() || undefined,
            });
            setEditingSetting(null);
            await loadRows();
        } catch (err) {
            console.error(err);
            setError('Không cập nhật được cấu hình. Kiểm tra quyền settings:update và dữ liệu JSON.');
        } finally {
            setIsSaving(false);
        }
    }

    const columns: ColumnProps<AppSetting>[] = [
        { key: 'setting_key', title: 'Khóa cấu hình', className: 'font-semibold text-gray-900' },
        { key: 'setting_value', title: 'Giá trị', render: (value) => <pre className="max-w-md whitespace-pre-wrap rounded bg-gray-50 px-2 py-1 text-xs text-gray-700">{formatJson(value)}</pre> },
        { key: 'description', title: 'Mô tả', render: (value) => String(value || '-') },
        { key: 'updated_by', title: 'Cập nhật bởi', render: (value) => value ? `#${String(value)}` : 'Hệ thống' },
        { key: 'updated_at', title: 'Cập nhật lúc', render: (value) => formatDateTime(String(value)) },
        {
            key: 'actions',
            title: 'Thao tác',
            render: (_, record) => canUpdateSettings
                ? <button type="button" onClick={() => openEdit(record)} className="text-xs font-medium text-blue-600 hover:text-blue-900">Sửa</button>
                : <span className="text-xs text-gray-400">Chỉ xem</span>,
        },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Cấu hình hệ thống</h1>
                    <p className="text-sm text-gray-500">Xem và cập nhật app settings. Nút sửa chỉ hiện khi tài khoản có quyền settings:update.</p>
                </div>
                {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex gap-2">
                        <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm theo khóa cấu hình..." className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                        <button type="button" onClick={() => void loadRows()} className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700">Lọc</button>
                    </div>
                </div>
                <Tablelayout columns={columns} dataSource={rows} rowKey="id" isLoading={isLoading} />
            </div>

            {editingSetting && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-100 bg-pink-50 px-6 py-4">
                            <h2 className="text-lg font-bold text-pink-700">Sửa cấu hình {editingSetting.setting_key}</h2>
                            <button type="button" onClick={() => setEditingSetting(null)} className="text-gray-400 hover:text-gray-600" aria-label="Đóng">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4 p-6">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Giá trị JSON</label>
                                <textarea value={settingValueText} onChange={(event) => setSettingValueText(event.target.value)} rows={8} className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Mô tả</label>
                                <input value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setEditingSetting(null)} className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                                <button type="submit" disabled={isSaving} className="flex-1 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-60">{isSaving ? 'Đang lưu' : 'Lưu cấu hình'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
