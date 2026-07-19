import React from 'react';
import type { RegisterData } from '@/features/auth/types';

interface RegisterModalProps {
    registerData: RegisterData;
    handleRegisterInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleRegister: (e: React.FormEvent) => void;
    isRegisterInvalid: boolean;
    onClose: () => void;
}

export default function RegisterModal({
    registerData,
    handleRegisterInputChange,
    handleRegister,
    isRegisterInvalid,
    onClose,
}: RegisterModalProps) {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(143, 100, 132, 0.8)', display: 'flex', justifyContent: 'center',
            alignItems: 'center'
        }}>
            <div style={{
                backgroundColor: 'white', padding: '30px', borderRadius: '12px',
                width: '450px', maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                maxHeight: '90vh', overflowY: 'auto'
            }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#DB2777' }}>Dang Ky Thanh Vien</h2>
                <form onSubmit={handleRegister}>
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Username:</label>
                        <input type="text" name="username" value={registerData.username} onChange={handleRegisterInputChange} required
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Password:</label>
                            <input type="password" name="password" value={registerData.password} onChange={handleRegisterInputChange} required
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Confirm Password:</label>
                            <input type="password" name="confirmPassword" value={registerData.confirmPassword} onChange={handleRegisterInputChange} required
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                            {registerData.confirmPassword && (
                                <span style={{ fontSize: '11px', marginTop: '4px', display: 'block', color: registerData.password === registerData.confirmPassword ? '#28a745' : '#dc3545' }}>
                                    {registerData.password === registerData.confirmPassword ? 'Mat khau trung khop' : 'Mat khau chua khop'}
                                </span>
                            )}
                        </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Email:</label>
                        <input type="email" name="email" value={registerData.email} onChange={handleRegisterInputChange} required
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>So dien thoai:</label>
                        <input type="text" name="sdt" value={registerData.sdt} onChange={handleRegisterInputChange} required
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Dia chi:</label>
                        <textarea name="diaChi" value={registerData.diaChi} onChange={handleRegisterInputChange} required
                            style={{
                                width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc',
                                boxSizing: 'border-box', minHeight: '60px', fontFamily: 'inherit'
                            }} />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="submit"
                            disabled={isRegisterInvalid}
                            style={{
                                flex: 2, padding: '12px',
                                backgroundColor: isRegisterInvalid ? '#F472B6' : '#BE185D',
                                color: 'white', border: 'none', borderRadius: '6px',
                                cursor: isRegisterInvalid ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Xac Nhan Dang Ky
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1, padding: '12px', backgroundColor: '#dc3545', color: 'white',
                                border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                            }}
                        >
                            Huy
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
