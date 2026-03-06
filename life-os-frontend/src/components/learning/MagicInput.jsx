import React, { useState } from 'react';
import { Sparkles, Loader2, Search } from 'lucide-react';
import { learningService } from '../../services/api';
import toast from 'react-hot-toast';

const MagicInput = ({ onMagicSuccess }) => {
    const [keyword, setKeyword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleMagicAdd = async (e) => {
        e.preventDefault();
        if (!keyword.trim()) return;

        setIsLoading(true);
        try {
            const response = await learningService.quickAdd({ keyword });
            const newFlashcard = response.data.data;

            toast.success('✨ Tạo Flashcard "Magic" thành công!');
            setKeyword('');

            if (onMagicSuccess) {
                onMagicSuccess(newFlashcard);
            }
        } catch (error) {
            console.error('Lỗi khi Magic Add:', error);
            toast.error(error.response?.data?.error || 'Không thể sử dụng phép thuật lúc này 😢');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleMagicAdd} className="relative group max-w-xl w-full mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
            </div>
            <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                disabled={isLoading}
                placeholder="Nhập 1 từ khóa (ví dụ: decision, 不) để AI 'nở' thành Flashcard..."
                className="block w-full pl-10 pr-32 py-4 border-2 border-transparent bg-white shadow-md rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
                type="submit"
                disabled={!keyword.trim() || isLoading}
                className="absolute inset-y-2 right-2 flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Đang niệm...
                    </>
                ) : (
                    <>
                        <Sparkles className="-ml-1 mr-2 h-4 w-4 text-yellow-300" />
                        Magic Add
                    </>
                )}
            </button>
        </form>
    );
};

export default MagicInput;
