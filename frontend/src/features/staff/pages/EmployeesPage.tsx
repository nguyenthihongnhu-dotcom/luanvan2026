import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import DashboardLayout from "@/layouts/dashboard/DashboardLayout";
import Tablelayout from "@/shared/ui/Table/TableLayout";
import { useSidebar } from "@/app/providers/useSidebar";
import type { ColumnProps } from "@/shared/ui/Table/types";
import { DEFAULT_RESET_PASSWORD, roleLabel, userService } from "@/features/staff/services/userService";
import { getHttpErrorMessage } from "@/shared/services/httpClient";
import { usePermissions } from "@/shared/auth/usePermissions";
import { warehouseService } from "@/features/warehouses/services/warehouseService";
import type { WarehouseOption } from "@/features/warehouses/services/warehouseService";
import type { PasswordResetRequest, User, UserRoleCode } from "@/features/staff/services/userService";

const roleOptions: Array<{ code: UserRoleCode; label: string }> = [
    { code: "ADMIN", label: roleLabel("ADMIN") },
    { code: "WAREHOUSE_MANAGER", label: roleLabel("WAREHOUSE_MANAGER") },
    { code: "STAFF", label: roleLabel("STAFF") },
    { code: "AUDITOR", label: roleLabel("AUDITOR") },
];

const initialFormState = {
    fullName: "",
    employeeCode: "",
    email: "",
    phone: "",
    password: "",
    roleCode: "STAFF" as UserRoleCode,
    status: "ACTIVE" as "ACTIVE" | "LOCKED" | "INACTIVE",
};

export default function EmployeesPage() {
    const { setExtraContent } = useSidebar();
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
    const [data, setData] = useState<User[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState(initialFormState);
    const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
    // Modal gán kho tách khỏi modal sửa thông tin: hai việc khác nhau, gộp lại thì
    // mỗi lần đổi số điện thoại cũng phải ngó lại danh sách kho.
    const [assigningUser, setAssigningUser] = useState<User | null>(null);
    const [assignedWarehouseIds, setAssignedWarehouseIds] = useState<number[]>([]);
    const [primaryWarehouseId, setPrimaryWarehouseId] = useState<number | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);
    // Kho chọn ngay trong form thêm/sửa. Tách khỏi state của modal "Gán kho" để hai
    // luồng không ghi đè nhau khi mở lần lượt.
    const [formWarehouseIds, setFormWarehouseIds] = useState<number[]>([]);
    const [formPrimaryWarehouseId, setFormPrimaryWarehouseId] = useState<number | null>(null);

    // Hàng đợi yêu cầu "Quên mật khẩu" nhân viên tự gửi từ màn hình đăng nhập.
    const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
    const [processingRequestId, setProcessingRequestId] = useState<number | null>(null);
    const [approvedInfo, setApprovedInfo] = useState<{ name: string; email: string } | null>(null);
    const canApproveReset = hasPermission("users:reset_password");

    /**
     * Tải danh sách nhân viên từ backend.
     * Cập nhật state `data`, `isLoading`, `error`.
     */
    async function loadUsers() {
        try {
            setIsLoading(true);
            setError(null);
            setData(await userService.listUsers());
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không tải được danh sách nhân viên từ backend"));
        } finally {
            setIsLoading(false);
        }
    }

    /**
     * Chỉ gọi khi tài khoản có quyền duyệt — endpoint này yêu cầu
     * `users:reset_password`, gọi khi không có quyền chỉ tổ sinh 403 vô ích.
     */
    const loadResetRequests = useCallback(async () => {
        if (!canApproveReset) {
            setResetRequests([]);
            return;
        }

        try {
            setResetRequests(await userService.listPasswordResetRequests("PENDING"));
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không tải được danh sách yêu cầu quên mật khẩu"));
        }
    }, [canApproveReset]);

    useEffect(() => { void loadUsers(); }, []);
    useEffect(() => {
        // Danh sách kho dùng cho cả cột hiển thị lẫn modal gán, tải một lần là đủ.
        void (async () => {
            try {
                setWarehouses(await warehouseService.listWarehouses());
            } catch (err) {
                console.error(err);
            }
        })();
    }, []);
    useEffect(() => { void loadResetRequests(); }, [loadResetRequests]);

    /**
     * Duyệt yêu cầu quên mật khẩu: backend đặt mật khẩu về mặc định, mở khóa tài
     * khoản và thu hồi mọi phiên đăng nhập cũ của nhân viên đó.
     */
    const handleApproveReset = async (request: PasswordResetRequest) => {
        if (!window.confirm(
            `Duyệt yêu cầu của ${request.fullName} (${request.email})?\n\n` +
            `Mật khẩu sẽ được đặt lại thành "${DEFAULT_RESET_PASSWORD}" và mọi phiên đăng nhập hiện tại của tài khoản này sẽ bị đăng xuất.`,
        )) return;

        setProcessingRequestId(request.id);
        setError(null);
        try {
            await userService.approvePasswordResetRequest(request.id);
            setApprovedInfo({ name: request.fullName, email: request.email });
            await loadResetRequests();
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không duyệt được yêu cầu đặt lại mật khẩu"));
        } finally {
            setProcessingRequestId(null);
        }
    };

    /** Từ chối yêu cầu — bắt buộc nêu lý do để nhân viên biết vì sao bị bỏ. */
    const handleRejectReset = async (request: PasswordResetRequest) => {
        const reason = window.prompt(`Lý do từ chối yêu cầu của ${request.fullName}:`, "");
        if (reason === null) return;
        if (!reason.trim()) {
            window.alert("Phải nhập lý do từ chối.");
            return;
        }

        setProcessingRequestId(request.id);
        setError(null);
        try {
            await userService.rejectPasswordResetRequest(request.id, reason.trim());
            await loadResetRequests();
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không từ chối được yêu cầu đặt lại mật khẩu"));
        } finally {
            setProcessingRequestId(null);
        }
    };

    useEffect(() => {
        setExtraContent(
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Lọc theo vai trò</label>
                    <select className="w-full text-sm border-gray-200 rounded-md" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option value="All">Tất cả vai trò</option>
                        {roleOptions.map((role) => <option key={role.code} value={role.label}>{role.label}</option>)}
                    </select>
                </div>
            </div>
        );
        return () => setExtraContent(null);
    }, [setExtraContent, roleFilter]);

    /** Mở modal tạo mới nhân viên — reset form về trạng thái rỗng, mặc định vai trò STAFF. */
    const openAssignModal = (user: User) => {
        setAssigningUser(user);
        setAssignedWarehouseIds(user.warehouseIds);
        setPrimaryWarehouseId(user.primaryWarehouseId);
        setError(null);
    };

    const toggleAssignedWarehouse = (warehouseId: number) => {
        setAssignedWarehouseIds((current) => {
            const next = current.includes(warehouseId)
                ? current.filter((id) => id !== warehouseId)
                : [...current, warehouseId];
            // Bỏ chọn kho đang là kho chính thì phải gỡ luôn, backend từ chối kho
            // chính không nằm trong danh sách.
            setPrimaryWarehouseId((primary) => (primary && next.includes(primary) ? primary : null));
            return next;
        });
    };

    const handleSaveAssignment = async () => {
        if (!assigningUser) return;
        setIsAssigning(true);
        setError(null);
        try {
            await userService.assignUserWarehouses(
                assigningUser.MaNguoiDung,
                assignedWarehouseIds,
                primaryWarehouseId,
            );
            setAssigningUser(null);
            await loadUsers();
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không lưu được kho phụ trách"));
        } finally {
            setIsAssigning(false);
        }
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData(initialFormState);
        setFormWarehouseIds([]);
        setFormPrimaryWarehouseId(null);
        setShowModal(true);
    };

    const toggleFormWarehouse = (warehouseId: number) => {
        setFormWarehouseIds((current) => {
            const next = current.includes(warehouseId)
                ? current.filter((id) => id !== warehouseId)
                : [...current, warehouseId];
            setFormPrimaryWarehouseId((primary) => (primary && next.includes(primary) ? primary : null));
            return next;
        });
    };

    /**
     * Mở modal chỉnh sửa nhân viên.
     * Map dữ liệu `User` sang cấu trúc form (bao gồm roleCode và status).
     * Trường `password` được reset về rỗng — chỉ submit nếu muốn thay mật khẩu.
     * @param user - Bản ghi nhân viên cần sửa.
     */
    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({
            fullName: user.HoTen,
            employeeCode: user.MaNhanVien,
            email: user.Email,
            phone: user.SoDienThoai,
            password: "",
            roleCode: user.roleCode,
            status: user.TrangThai === "HoatDong" ? "ACTIVE" : "LOCKED",
        });
        setFormWarehouseIds(user.warehouseIds);
        setFormPrimaryWarehouseId(user.primaryWarehouseId);
        setShowModal(true);
    };

    /**
     * Xử lý submit form tạo mới / cập nhật nhân viên.
     * - Nếu `editingUser` tồn tại → gọi updateUser.
     * - Nếu không → gọi createUser (yêu cầu quyền `users:create`).
     * Sau khi lưu: đóng modal, reset form, reload danh sách.
     */
    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        // Chỉ nhân viên kho mới cần gán kho; các vai trò còn lại xem được mọi kho
        // nên gán cũng không có tác dụng gì.
        const warehouseIds = formData.roleCode === "STAFF" ? formWarehouseIds : [];
        const primaryWarehouseId =
            formData.roleCode === "STAFF" ? formPrimaryWarehouseId : null;

        if (editingUser) {
            await userService.updateUser(editingUser.MaNguoiDung, formData);
            await userService.assignUserWarehouses(editingUser.MaNguoiDung, warehouseIds, primaryWarehouseId);
        } else {
            const created = await userService.createUser(formData);
            // Tài khoản vừa tạo mới có id, nên phần gán kho phải chạy sau.
            if (created?.id) {
                await userService.assignUserWarehouses(created.id, warehouseIds, primaryWarehouseId);
            }
        }
        setShowModal(false);
        setEditingUser(null);
        setFormData(initialFormState);
        await loadUsers();
    };

    /**
     * Bật/tắt tài khoản nhân viên. Không xóa tài khoản: mọi phiếu nhập, xuất,
     * điều chỉnh và dòng audit_logs đều trỏ tới người tạo/người duyệt, xóa đi là
     * nhật ký kho mất người chịu trách nhiệm. Ngưng hoạt động thì tài khoản
     * không đăng nhập được nữa nhưng lịch sử vẫn nguyên vẹn.
     */
    const handleToggleStatus = async (user: User) => {
        const isActive = user.TrangThai === "HoatDong";
        const action = isActive ? "Ngưng hoạt động" : "Cho hoạt động lại";
        if (!window.confirm(`${action} tài khoản ${user.HoTen}?${isActive ? " Nhân viên sẽ không đăng nhập được nữa, lịch sử thao tác vẫn được giữ." : ""}`)) return;

        await userService.updateUser(user.MaNguoiDung, {
            email: user.Email,
            fullName: user.HoTen,
            phone: user.SoDienThoai || undefined,
            employeeCode: user.MaNhanVien || undefined,
            roleCode: user.roleCode,
            status: isActive ? "INACTIVE" : "ACTIVE",
        });
        await loadUsers();
    };

    /**
     * Đặt lại mật khẩu của nhân viên về giá trị mặc định. Giống hệt kết quả của
     * việc duyệt yêu cầu quên mật khẩu bên trên — hệ thống chỉ có một cách đặt
     * lại mật khẩu, nên quản trị viên không phải nhớ hai quy trình khác nhau.
     */
    const handleResetPassword = async (user: User) => {
        if (!window.confirm(
            `Đặt lại mật khẩu cho ${user.HoTen} (${user.Email})?\n\n` +
            `Mật khẩu sẽ thành "${DEFAULT_RESET_PASSWORD}" và mọi phiên đăng nhập hiện tại của tài khoản này sẽ bị đăng xuất.`,
        )) return;

        setError(null);
        try {
            await userService.resetUserPassword(user.MaNguoiDung);
            setApprovedInfo({ name: user.HoTen, email: user.Email });
        } catch (err) {
            console.error(err);
            setError(getHttpErrorMessage(err, "Không đặt lại được mật khẩu cho nhân viên"));
        }
    };

    const columns: ColumnProps<User>[] = [
        { key: "MaNhanVien", title: "Mã NV", className: "font-medium text-gray-900" },
        { key: "HoTen", title: "Họ và tên" },
        { key: "Email", title: "Email" },
        { key: "SoDienThoai", title: "Số điện thoại" },
        { key: "VaiTro", title: "Vai trò" },
        {
            key: "warehouseIds",
            title: "Kho phụ trách",
            render: (_, record) => {
                // Quản trị, quản lý kho và kiểm toán xem được mọi kho nên không cần gán.
                if (record.roleCode !== "STAFF") {
                    return <span className="text-xs text-gray-500">Toàn bộ kho</span>;
                }
                if (record.warehouseIds.length === 0) {
                    return <span className="text-xs font-medium text-amber-600">Chưa gán kho</span>;
                }
                return (
                    <div className="flex flex-wrap gap-1">
                        {record.warehouseIds.map((warehouseId) => {
                            const warehouse = warehouses.find((item) => item.id === warehouseId);
                            const isPrimary = record.primaryWarehouseId === warehouseId;
                            return (
                                <span
                                    key={warehouseId}
                                    title={isPrimary ? "Kho chính" : undefined}
                                    className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${isPrimary
                                        ? "border-pink-200 bg-pink-50 text-pink-700"
                                        : "border-gray-200 bg-gray-50 text-gray-600"}`}
                                >
                                    {warehouse?.code ?? `Kho #${warehouseId}`}{isPrimary ? " ★" : ""}
                                </span>
                            );
                        })}
                    </div>
                );
            },
        },
        {
            key: "TrangThai",
            title: "Trạng thái",
            render: (val) => {
                const isActive = val === "HoatDong";
                return (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${isActive
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-600 border-gray-300"}`}>
                        {isActive ? "Đang hoạt động" : "Ngưng hoạt động"}
                    </span>
                );
            },
        },
        {
            key: "actions",
            title: "Thao tác",
            width: "230px",
            render: (_, record) => {
                const isActive = record.TrangThai === "HoatDong";
                return (
                    <div className="flex flex-wrap gap-1">
                        <button type="button" onClick={() => openEditModal(record)} className="btn-action btn-blue">Sửa</button>
                        {record.roleCode === "STAFF" && (
                            <button type="button" onClick={() => openAssignModal(record)} className="btn-action btn-green">Gán kho</button>
                        )}
                        {canApproveReset && (
                            <button
                                type="button"
                                onClick={() => void handleResetPassword(record)}
                                className="btn-action btn-blue"
                                title={`Đặt mật khẩu về ${DEFAULT_RESET_PASSWORD} và đăng xuất mọi phiên của tài khoản này`}
                            >
                                Đặt lại mật khẩu
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => void handleToggleStatus(record)}
                            className={`btn-action ${isActive ? "btn-red" : "btn-green"}`}
                            title={isActive
                                ? "Ngưng hoạt động: nhân viên không đăng nhập được nữa, lịch sử thao tác vẫn giữ nguyên"
                                : "Cho tài khoản hoạt động trở lại"}
                        >
                            {isActive ? "Ngưng" : "Bật lại"}
                        </button>
                    </div>
                );
            },
        },
    ];

    const normalizedSearch = searchTerm.toLowerCase();
    const filteredData = data.filter(user =>
        (roleFilter === "All" || user.VaiTro === roleFilter) &&
        (user.HoTen.toLowerCase().includes(normalizedSearch) || user.MaNhanVien.toLowerCase().includes(normalizedSearch) || user.Email.toLowerCase().includes(normalizedSearch))
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Danh sách nhân viên hệ thống</h1>
                    <button type="button" onClick={openCreateModal} className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700">+ Thêm nhân viên</button>
                </div>
                {error && <div className="text-sm text-red-600">{error}</div>}

                {canApproveReset && resetRequests.length > 0 && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-sm font-bold text-amber-900">Yêu cầu quên mật khẩu chờ duyệt</h2>
                            <span className="rounded-full border border-amber-300 bg-white px-2 py-0.5 text-xs font-semibold text-amber-800">
                                {resetRequests.length}
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-amber-800">
                            Nhân viên tự gửi từ màn hình đăng nhập. Duyệt sẽ đặt mật khẩu về{" "}
                            <code className="rounded border border-amber-300 bg-white px-1 font-mono">{DEFAULT_RESET_PASSWORD}</code>,
                            mở khóa tài khoản và đăng xuất mọi phiên đang mở của tài khoản đó.
                        </p>
                        <ul className="mt-3 space-y-2">
                            {resetRequests.map((request) => (
                                <li
                                    key={request.id}
                                    className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-amber-200 bg-white px-3 py-2"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900">
                                            {request.fullName}{" "}
                                            <span className="font-normal text-gray-500">
                                                ({request.employeeCode} · {roleLabel(request.roleCode)})
                                            </span>
                                        </p>
                                        <p className="text-xs text-gray-600">{request.email}</p>
                                        {request.note && (
                                            <p className="mt-1 text-xs text-gray-500 italic">Ghi chú: {request.note}</p>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                        <button
                                            type="button"
                                            disabled={processingRequestId === request.id}
                                            onClick={() => void handleApproveReset(request)}
                                            className="btn-action btn-green disabled:opacity-50"
                                            title={`Đặt lại mật khẩu về ${DEFAULT_RESET_PASSWORD}`}
                                        >
                                            {processingRequestId === request.id ? "Đang xử lý..." : "Duyệt"}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={processingRequestId === request.id}
                                            onClick={() => void handleRejectReset(request)}
                                            className="btn-action btn-red disabled:opacity-50"
                                        >
                                            Từ chối
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {approvedInfo && (
                    <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                        <p className="font-semibold">
                            Đã đặt lại mật khẩu cho {approvedInfo.name} ({approvedInfo.email})
                        </p>
                        <p className="mt-1 text-xs">
                            Mật khẩu hiện tại:{" "}
                            <code className="select-all rounded border border-green-300 bg-white px-1.5 py-0.5 font-mono">
                                {DEFAULT_RESET_PASSWORD}
                            </code>
                        </p>
                        <button
                            type="button"
                            onClick={() => setApprovedInfo(null)}
                            className="mt-2 rounded-md border border-green-300 bg-white px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-100"
                        >
                            Đóng
                        </button>
                    </div>
                )}

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <input type="text" placeholder="Tìm theo tên, email hoặc mã nhân viên..." className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 outline-none text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                {isLoading ? <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">Đang tải nhân viên...</div> : <Tablelayout columns={columns} dataSource={filteredData} rowKey="MaNguoiDung" />}
            </div>

            {assigningUser && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-100 bg-pink-50 px-6 py-4">
                            <div>
                                <h2 className="text-lg font-bold text-pink-700">Gán kho phụ trách</h2>
                                <p className="text-xs text-gray-500">{assigningUser.HoTen} ({assigningUser.MaNhanVien})</p>
                            </div>
                            <button type="button" onClick={() => setAssigningUser(null)} className="text-gray-400 hover:text-gray-600" aria-label="Đóng">×</button>
                        </div>
                        <div className="space-y-3 p-6">
                            <p className="text-xs text-gray-500">
                                Nhân viên chỉ thấy tồn kho, chứng từ và cảnh báo của kho được gán, và chỉ tạo được
                                chứng từ cho những kho đó. Cảnh báo của kho cũng gửi thông báo cho mọi người phụ trách kho.
                            </p>
                            {warehouses.length === 0 ? (
                                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-500">Chưa có kho nào trong hệ thống.</div>
                            ) : (
                                <div className="space-y-2">
                                    {warehouses.map((warehouse) => {
                                        const checked = assignedWarehouseIds.includes(warehouse.id);
                                        return (
                                            <label key={warehouse.id} className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 ${checked ? "border-pink-200 bg-pink-50" : "border-gray-200"}`}>
                                                <span className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleAssignedWarehouse(warehouse.id)}
                                                        className="h-4 w-4 accent-pink-600"
                                                    />
                                                    <span className="font-medium text-gray-800">{warehouse.code}</span>
                                                    <span className="text-gray-500">{warehouse.name ?? ""}</span>
                                                </span>
                                                {checked && (
                                                    <label className="flex items-center gap-1.5 text-xs text-gray-600">
                                                        <input
                                                            type="radio"
                                                            name="primaryWarehouse"
                                                            checked={primaryWarehouseId === warehouse.id}
                                                            onChange={() => setPrimaryWarehouseId(warehouse.id)}
                                                            className="h-3.5 w-3.5 accent-pink-600"
                                                        />
                                                        Kho chính
                                                    </label>
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                            {assignedWarehouseIds.length === 0 && (
                                <p className="text-xs font-medium text-amber-600">
                                    Không chọn kho nào nghĩa là nhân viên này sẽ không thấy dữ liệu vận hành nào.
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
                            <button type="button" onClick={() => setAssigningUser(null)} className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                            <button type="button" onClick={() => void handleSaveAssignment()} disabled={isAssigning} className="flex-1 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-60">
                                {isAssigning ? "Đang lưu" : "Lưu"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-100 bg-pink-50 px-6 py-4">
                            <h2 className="text-lg font-bold text-pink-700">{editingUser ? "Sửa nhân viên" : "Thêm nhân viên"}</h2>
                            <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600" aria-label="Đóng">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4 p-6">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Họ và tên</label>
                                <input required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Mã nhân viên</label>
                                <input value={formData.employeeCode} onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })} placeholder="Để trống để backend tự sinh" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Email đăng nhập</label>
                                <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Số điện thoại</label>
                                <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Vai trò</label>
                                <select value={formData.roleCode} onChange={(e) => setFormData({ ...formData, roleCode: e.target.value as UserRoleCode })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500">
                                    {roleOptions.map((role) => <option key={role.code} value={role.code}>{role.label}</option>)}
                                </select>
                            </div>
                            {formData.roleCode === "STAFF" && (
                                <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Kho phụ trách</label>
                                    <p className="mb-2 text-xs text-gray-500">
                                        Nhân viên chỉ thấy tồn kho, chứng từ, cảnh báo của kho được chọn và chỉ tạo được
                                        chứng từ cho kho đó. Không chọn kho nào thì họ không thấy dữ liệu vận hành nào.
                                    </p>
                                    {warehouses.length === 0 ? (
                                        <div className="text-sm text-gray-500">Chưa có kho nào trong hệ thống.</div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {warehouses.map((warehouse) => {
                                                const checked = formWarehouseIds.includes(warehouse.id);
                                                return (
                                                    <label key={warehouse.id} className={`flex items-center justify-between gap-3 rounded-md border px-2.5 py-1.5 ${checked ? "border-pink-200 bg-white" : "border-transparent"}`}>
                                                        <span className="flex items-center gap-2 text-sm">
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => toggleFormWarehouse(warehouse.id)}
                                                                className="h-4 w-4 accent-pink-600"
                                                            />
                                                            <span className="font-medium text-gray-800">{warehouse.code}</span>
                                                            <span className="text-gray-500">{warehouse.name ?? ""}</span>
                                                        </span>
                                                        {checked && (
                                                            <label className="flex items-center gap-1.5 text-xs text-gray-600">
                                                                <input
                                                                    type="radio"
                                                                    name="formPrimaryWarehouse"
                                                                    checked={formPrimaryWarehouseId === warehouse.id}
                                                                    onChange={() => setFormPrimaryWarehouseId(warehouse.id)}
                                                                    className="h-3.5 w-3.5 accent-pink-600"
                                                                />
                                                                Kho chính
                                                            </label>
                                                        )}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                            {editingUser && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Trạng thái</label>
                                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500">
                                        <option value="ACTIVE">Đang hoạt động</option>
                                        <option value="LOCKED">Tạm khóa</option>
                                        <option value="INACTIVE">Ngưng hoạt động</option>
                                    </select>
                                </div>
                            )}
                            {!editingUser && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu</label>
                                    <input required type="password" minLength={6} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500" />
                                </div>
                            )}
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                                <button type="submit" className="flex-1 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700">Lưu nhân viên</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}