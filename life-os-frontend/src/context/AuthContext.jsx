import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Để cho "thật", ta sẽ lấy ID từ database thực mà tôi đã kiểm tra trước đó
    const [user, setUser] = useState({
        id: '1b0eca16-b3d4-4d27-b172-c59c54984ce3', // ID thực từ database
        name: 'Toàn'
    });

    useEffect(() => {
        // Sau này có thể login/logout ở đây
        // Hiện tại ta lưu vào localStorage để giữ session
        localStorage.setItem('userId', user.id);
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
