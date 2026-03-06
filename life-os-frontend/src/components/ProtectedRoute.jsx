import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <div className="p-4 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-2xl shadow-indigo-500/30">
                    <Brain size={36} className="text-white" />
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 size={18} className="animate-spin text-indigo-500" />
                    <span className="text-sm font-medium">Đang tải...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Lưu lại URL muốn vào để sau khi login redirect đúng trang
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
