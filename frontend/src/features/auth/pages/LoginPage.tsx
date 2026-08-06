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
            </form>

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