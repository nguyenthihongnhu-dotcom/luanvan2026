import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterModal from './components/RegisterModal';
import type { RegisterData } from './components/RegisterModal';

// Giả lập (Mock) các thành phần Backend để giao diện chạy được trong lúc code UI
const api = {
    post: async (path: string, data: any) => {
        console.log(`[Mock API POST] ${path}`, data);
        await new Promise(resolve => setTimeout(resolve, 800));

        if (path === '/dang-nhap') {
            const { username, password } = data;
            if (username === 'admin' && password === 'admin123') {
                return {
                    data: {
                        result: { maTK: 'AD001', role: 'ADMIN', ten: 'Quản trị viên' },
                        message: 'Đăng nhập quyền Admin thành công!'
                    }
                };
            }
            if (username === 'user' && password === '123456') {
                return {
                    data: {
                        result: { maTK: 'KH001', role: 'KHACHHANG', ten: 'Khách hàng mẫu' },
                        message: 'Đăng nhập thành công!'
                    }
                };
            }
            throw { response: { data: { message: 'Tài khoản hoặc mật khẩu không đúng (Thử admin/admin123 hoặc user/123456)' } } };
        }

        return { data: { result: { maTK: '123', role: 'KHACHHANG' }, message: 'Thao tác giả lập thành công!' } };
    }
};

const updateCustomerInfo = (data: any) => console.log('[Mock Context] Cập nhật thông tin khách hàng:', data);

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [registerData, setRegisterData] = useState<RegisterData>({
        username: '',
        password: '',
        confirmPassword: '',
        sdt: '',
        email: '',
        diaChi: '',
    });

    const handleRegisterInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setRegisterData({ ...registerData, [name]: value });
    };

    const validateRegister = () => {
        const { username, password, confirmPassword, sdt, email, diaChi } = registerData;
        if (!username || !password || !confirmPassword || !sdt || !email || !diaChi) {
            return "Vui lòng nhập đầy đủ tất cả các trường.";
        }
        if (password !== confirmPassword) {
            return "Mật khẩu xác nhận không trùng khớp.";
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
            const { confirmPassword, ...dataToSend } = registerData;
            const response = await api.post('/dang-ky', dataToSend);

            alert(response.data?.message || "Đăng ký thành công!");
            setShowRegisterModal(false);
            setRegisterData({ username: '', password: '', confirmPassword: '', sdt: '', email: '', diaChi: '' });
            navigate('/');
        } catch (err: any) {
            console.error('Lỗi đăng ký:', err);
            alert(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError('');
            const response = await api.post('/dang-nhap', { username, password });
            const result = response.data?.result;

            if (!result || !result.role) {
                setError('Không lấy được thông tin phân quyền từ server.');
                return;
            }

            localStorage.setItem('maTK', result.maTK);
            localStorage.setItem('role', result.role);
            updateCustomerInfo(result);

            const redirectRoutes: Record<string, string> = {
                ADMIN: '/products',
                KHACHHANG: '/cusorderpage',
            };
            const targetPath = redirectRoutes[result.role] || '/';
            navigate(targetPath);
        } catch (err: any) {
            console.error('Lỗi đăng nhập:', err);
            setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu.');
        }
    };

    // TỐI ƯU: Đưa biến kiểm tra dữ liệu hợp lệ (Validation) lên đây trước lệnh return của Component
    const isRegisterInvalid = !registerData.username ||
        !registerData.password ||
        !registerData.confirmPassword ||
        registerData.password !== registerData.confirmPassword;

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#DB2777' }}>Đăng Nhập</h2>
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
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
                        Đăng Nhập
                    </button>
                    <button
                        type="button"
                        style={{ flex: 1, padding: '10px', backgroundColor: '#16b423', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                        onClick={() => setShowRegisterModal(true)}
                    >
                        Đăng Ký
                    </button>
                </div>
            </form>

            {/* Popup Đăng Ký */}
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