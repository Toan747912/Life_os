import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api'; // Dùng api instance đã tạo
import { Book, Clock, FileText, ChevronRight, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Learning = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy danh sách
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await api.get('/learning');
        setResources(res.data.data || []);
      } catch (error) {
        console.error("Lỗi tải tài liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thư viện kiến thức</h1>
          <p className="text-gray-500 mt-1">Quản lý {resources.length} tài liệu bạn đã phân tích</p>
        </div>
      </div>

      {/* Loading State */}
      {loading && <div className="text-center py-10">Đang tải dữ liệu...</div>}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((item) => (
          <div key={item.id} className="group bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-300 flex flex-col h-full">

            {/* Card Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileText size={24} />
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium border ${item.difficulty === 'Advanced' ? 'bg-red-50 text-red-600 border-red-100' :
                item.difficulty === 'Intermediate' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                  'bg-green-50 text-green-600 border-green-100'
                }`}>
                {item.difficulty || 'General'}
              </span>
            </div>

            {/* Content */}
            <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {item.title}
            </h3>
            <p className="text-gray-500 text-sm line-clamp-3 mb-4 flex-1">
              {item.summary}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-gray-400 border-t border-gray-100 pt-4 mt-auto">
              <div className="flex items-center gap-1">
                <Layers size={14} />
                <span>{item.learningItems.length} từ vựng</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>

            {/* Button Xem chi tiết */}
            <Link
              to={`/learning/${item.id}`}
              className="w-full mt-4 py-2 rounded-lg bg-gray-50 text-gray-600 text-sm font-medium hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              Xem chi tiết <ChevronRight size={16} />
            </Link>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && resources.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed">
          <Book className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Chưa có bài học nào. Hãy quay lại Dashboard để thêm mới!</p>
        </div>
      )}
    </div>
  );
};

export default Learning;