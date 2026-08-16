import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterModal from '@/features/auth/components/RegisterModal';
import { authService, getAuthErrorMessage } from '@/features/auth/services/authService';
import { useAuth } from '@/features/auth/context/useAuth';
import type { RegisterData, RegisterPayload } from '@/features/auth/types';

const emptyRegisterData: RegisterData = {
    username: '',
    password: '',
    confirmPassword: '',
    sdt: '',
    email: '',
    diaChi: '',
};

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const auth = useAuth();
    const [error, setError] = useState('');

    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [registerData, setRegisterData] = useState<RegisterData>(emptyRegisterData);

    // Quên mật khẩu: gửi yêu cầu cho quản trị viên duyệt, không tự đặt lại được.
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotNote, setForgotNote] = useState('');
    const [forgotSending, setForgotSending] = useState(false);
    const [forgotSent, setForgotSent] = useState(false);
    const [forgotError, setForgotError] = useState('');

    const openForgotModal = () => {
        setForgotEmail(username);       // đỡ phải gõ lại email vừa nhập ở ô đăng nhập
        setForgotNote('');
        setForgotSent(false);
        setForgotError('');
        setShowForgotModal(true);
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotSending(true);
        setForgotError('');

        try {
            await authService.requestPasswordResetApproval(forgotEmail, forgotNote);
            setForgotSent(true);
        } catch (err: unknown) {
            console.error('Lỗi gửi yêu cầu quên mật khẩu:', err);
            setForgotError(getAuthErrorMessage(err, 'Không gửi được yêu cầu. Vui lòng thử lại sau.'));
        } finally {
            setForgotSending(false);
        }
    };

    const handleRegisterInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setRegisterData({ ...registerData, [name]: value });
    };

    const validateRegister = () => {
        const { username, password, confirmPassword, sdt, email, diaChi } = registerData;
        if (!username || !password || !confirmPassword || !sdt || !email || !diaChi) {
            return 'Vui lòng nhập đầy đủ tất cả các trường.';
        }
        if (password !== confirmPassword) {
            return 'Mật khẩu xác nhận không trùng khớp.';
        }
        return null;
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validateRegister();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setError('');
            const payload: RegisterPayload = {
                username: registerData.username,
                password: registerData.password,
                sdt: registerData.sdt,
                email: registerData.email,
                diaChi: registerData.diaChi,
            };
            const response = await authService.register(payload);

            alert(response.message);
            setShowRegisterModal(false);
            setRegisterData(emptyRegisterData);
            navigate('/');
        } catch (err: unknown) {
            console.error('Lỗi đăng ký:', err);
            alert(getAuthErrorMessage(err, 'Đăng ký thất bại. Vui lòng thử lại.'));
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError('');
            const response = await authService.login({ username, password });
            const result = response.result;

            if (!result?.role) {
                setError('Không lấy được thông tin phân quyền từ server.');
                return;
            }

            auth.login(result);

            const redirectRoutes: Record<string, string> = {
                ADMIN: '/products',
                WAREHOUSE_MANAGER: '/products',
                STAFF: '/transactions',
                AUDITOR: '/transactions',
                KHACHHANG: '/cusorderpage',
            };
            const targetPath = redirectRoutes[result.role] || '/products';
            navigate(targetPath);
        } catch (err: unknown) {
            console.error('Lỗi đăng nhập:', err);
            setError(getAuthErrorMessage(err, 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu.'));
        }
    };

    const isRegisterInvalid = !registerData.username ||
        !registerData.password ||
        !registerData.confirmPassword ||
        registerData.password !== registerData.confirmPassword;

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#DB2777', font: 'bold 20px Arial' }}>Đăng nhập Bambi WMS</h2>
            {/* <span className="truncate text-xl font-bold tracking-wider text-pink-600">Bambi WMS</span> */}
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
                    <input
                        type="email"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Mật khẩu:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        type="submit"
                        style={{ flex: 1, padding: '10px', backgroundColor: '#DB2777', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                    >
                        Đăng nhập
                    </button>
                    {/* <button
                        type="button"
                        style={{ flex: 1, padding: '10px', backgroundColor: '#16b423', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                        onClick={() => setShowRegisterModal(true)}
                    >
                        Đăng ký
                    </button> */}
                </div>

                <div style={{ marginTop: '14px', textAlign: 'center' }}>
                    <button
                        type="button"
                        onClick={openForgotModal}
                        style={{ background: 'none', border: 'none', color: '#DB2777', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline', padding: 0 }}
                    >
                        Quên mật khẩu?
                    </button>
                </div>
            </form>

            {showForgotModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'rgba(15, 23, 42, 0.45)' }}>
                    <div style={{ width: '100%', maxWidth: '420px', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: '#FDF2F8', borderBottom: '1px solid #FBCFE8' }}>
                            <h3 style={{ margin: 0, color: '#BE185D', fontSize: '17px', fontWeight: 700 }}>Quên mật khẩu</h3>
                            <button
                                type="button"
                                onClick={() => setShowForgotModal(false)}
                                aria-label="Đóng"
                                style={{ background: 'none', border: 'none', fontSize: '22px', lineHeight: 1, color: '#9CA3AF', cursor: 'pointer' }}
                            >
                                ×
                            </button>
                        </div>

                        {forgotSent ? (
                            <div style={{ padding: '20px' }}>
                                <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#166534', fontWeight: 600 }}>
                                    Đã gửi yêu cầu tới quản trị viên.
                                </p>
                                <p style={{ margin: 0, fontSize: '13px', color: '#4B5563', lineHeight: 1.55 }}>
                                    Nếu email vừa nhập có tài khoản trong hệ thống, quản trị viên sẽ thấy yêu cầu này ở
                                    màn hình quản lý nhân viên. Sau khi được duyệt, mật khẩu sẽ là <strong>123456</strong>.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(false)}
                                    style={{ marginTop: '16px', width: '100%', padding: '10px', backgroundColor: '#DB2777', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}
                                >
                                    Đã hiểu
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleForgotPassword} style={{ padding: '20px' }}>
                                <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#4B5563', lineHeight: 1.55 }}>
                                    Nhập email đăng nhập của bạn. Yêu cầu sẽ được gửi tới quản trị viên; khi được duyệt,
                                    mật khẩu sẽ về mặc định <strong>123456</strong>.
                                </p>

                                {forgotError && (
                                    <p style={{ margin: '0 0 12px', color: 'red', fontSize: '13px' }}>{forgotError}</p>
                                )}

                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Email đăng nhập:</label>
                                    <input
                                        type="email"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Ghi chú cho quản trị viên (không bắt buộc):</label>
                                    <textarea
                                        value={forgotNote}
                                        onChange={(e) => setForgotNote(e.target.value)}
                                        maxLength={500}
                                        rows={3}
                                        placeholder="Ví dụ: đổi điện thoại nên không nhớ mật khẩu"
                                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', fontSize: '14px' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotModal(false)}
                                        style={{ flex: 1, padding: '10px', backgroundColor: 'white', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '4px', cursor: 'pointer', fontSize: '15px' }}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={forgotSending}
                                        style={{ flex: 1, padding: '10px', backgroundColor: '#DB2777', color: 'white', border: 'none', borderRadius: '4px', cursor: forgotSending ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: 'bold', opacity: forgotSending ? 0.6 : 1 }}
                                    >
                                        {forgotSending ? 'Đang gửi...' : 'Gửi yêu cầu'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {showRegisterModal && (
                <RegisterModal
                    registerData={registerData}
                    handleRegisterInputChange={handleRegisterInputChange}
                    handleRegister={handleRegister}
                    isRegisterInvalid={isRegisterInvalid}
                    onClose={() => setShowRegisterModal(false)}
                />
            )}
        </div>
    );
};

export default Login;