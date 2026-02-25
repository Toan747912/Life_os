import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { Brain, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await authService.login(email, password);
            const { token, user } = response.data;

            // Lưu token và thông tin user
            localStorage.setItem('token', token);
            localStorage.setItem('userId', user.id);
            localStorage.setItem('user', JSON.stringify(user));

            // Chuyển hướng về trang chủ
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Đăng nhập thất bại.');
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
                    <div className="flex items-center gap-2 text-indigo-600 mb-10 justify-center">
                        <Brain size={40} />
                        <h1 className="text-3xl font-extrabold tracking-tight">Life OS</h1>
                    </div>

                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
                        <p className="text-slate-500">Sign in to continue your learning journey.</p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                            <span className="font-medium">Error:</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
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
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end">
                            <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                Forgot password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-all"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                                Sign up now <ArrowRight className="inline" size={16} />
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side: Hero Image / Pattern */}
            <div className="hidden lg:flex flex-1 items-center justify-center bg-indigo-50 relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-200 via-indigo-50 to-white opacity-60"></div>
                </div>
                <div className="z-10 max-w-lg p-8 text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-white rounded-3xl shadow-xl shadow-indigo-200 mb-8 border border-white">
                        <Brain className="text-indigo-600" size={60} />
                    </div>
                    <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                        Master Your Mind,<br />
                        <span className="text-indigo-600">Systemize Your Life.</span>
                    </h2>
                    <p className="text-lg text-slate-600 leading-relaxed font-medium">
                        Life OS is your all-in-one platform for learning languages, tracking habits, and managing daily tasks.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
