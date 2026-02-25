import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { Brain, Lock, Mail, User, ArrowRight, Loader2 } from 'lucide-react';

const Register = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await authService.register(email, password, fullName);
            // Đăng ký thành công, tự động chuyển về trang đăng nhập
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Đăng ký thất bại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex text-slate-900 bg-slate-50">
            {/* Left Side: Form */}
            <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-white z-10 shadow-2xl lg:max-w-md xl:max-w-lg">
                <div className="w-full max-w-sm">
                    {/* Logo */}
                    <div className="flex items-center gap-2 text-indigo-600 mb-8 justify-center">
                        <Brain size={40} />
                        <h1 className="text-3xl font-extrabold tracking-tight">Life OS</h1>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold mb-2">Create an Account</h2>
                        <p className="text-slate-500">Join Life OS and start your journey.</p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                            <span className="font-medium">Error:</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700">Full Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm bg-slate-50 transition-all outline-none"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm bg-slate-50 transition-all outline-none"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm bg-slate-50 transition-all outline-none"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-all mt-4"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-600">
                            Already have an account?{' '}
                            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                                Sign in here <ArrowRight className="inline" size={16} />
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side: Design */}
            <div className="hidden lg:flex flex-1 items-center justify-center bg-indigo-50 relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-white opacity-80" style={{ backgroundImage: 'radial-gradient(circle at 100% 100%, #e0e7ff 0%, transparent 50%), radial-gradient(circle at 0% 0%, #e0e7ff 0%, transparent 50%)' }}></div>
                </div>
                <div className="z-10 max-w-lg p-8 text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-white rounded-3xl shadow-xl shadow-indigo-200 mb-8 border border-white">
                        <Brain className="text-indigo-600" size={60} />
                    </div>
                    <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                        Unlock Your Potential.
                    </h2>
                    <p className="text-lg text-slate-600 leading-relaxed font-medium">
                        Join our community and start building better habits, learning faster, and organizing your life.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
