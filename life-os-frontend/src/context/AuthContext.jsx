import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

const getStoredUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getStoredUser);
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    // Kiểm tra tính hợp lệ của token khi app khởi động
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = getStoredUser();

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(storedUser);
        } else {
            // Xóa sạch nếu có một trong hai
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
        }
        setIsLoading(false);
    }, []);

    const login = useCallback((newToken, newUser) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('userId', newUser.id);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    }, []);

    const isAuthenticated = !!token && !!user;

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout }}>
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
