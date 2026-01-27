"use client";
import { useState, useEffect, use } from "react"; // Chú ý: import 'use' cho Next.js 13+
import Link from "next/link";

export default function GoalDetail({ params }) {
    // Trong Next.js App Router, params là một Promise, cần unwrap
    const { id } = use(params);

    const [goal, setGoal] = useState(null);
    const [resources, setResources] = useState([]);
    const [newResTitle, setNewResTitle] = useState("");
    const [newResUrl, setNewResUrl] = useState("");
    const [posts, setPosts] = useState([]);

    // Hàm load dữ liệu
    useEffect(() => {
        async function fetchData() {
            try {
                // 1. Lấy thông tin Goal
                const goalRes = await fetch(`http://localhost:8080/api/goals/${id}`);
                const goalData = await goalRes.json();
                setGoal(goalData);

                // 2. Lấy danh sách Resources
                const resRes = await fetch(`http://localhost:8080/api/goals/${id}/resources`);
                const resData = await resRes.json();
                setResources(Array.isArray(resData) ? resData : []);

                // 3. Lấy danh sách Posts
                const postRes = await fetch(`http://localhost:8080/api/posts?goal_id=${id}`);
                const postData = await postRes.json();
                setPosts(Array.isArray(postData) ? postData : []);
            } catch (err) {
                console.error("Lỗi load dữ liệu:", err);
            }
        }
        if (id) fetchData();
    }, [id]);

    const [resType, setResType] = useState("TEXT");
    const [resContent, setResContent] = useState("");

    // Hàm thêm Resource đã cập nhật
    const handleAddResource = async (e) => {
        e.preventDefault();
        if (!newResTitle) return;

        // Logic chặn nếu chọn tính năng đang phát triển
        if (resType !== "TEXT") {
            alert("Tính năng này đang phát triển!");
            return;
        }

        try {
            const res = await fetch("http://localhost:8080/api/resources", { // Port 8080 as seen in previous view_file
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    goal_id: id,
                    title: newResTitle,
                    url: newResUrl, // Vẫn giữ url nếu user muốn lưu link tham khảo
                    type: resType,
                    content: resContent // Gửi nội dung text lên server
                }),
            });

            if (res.ok) {
                // Reset form
                setNewResTitle("");
                setNewResUrl("");
                setResContent("");
                setResType("TEXT");

                // Refresh list
                const updatedRes = await fetch(`http://localhost:8080/api/goals/${id}/resources`);
                setResources(await updatedRes.json());
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (!goal) return <div className="p-8">Đang tải chi tiết mục tiêu...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto">
                {/* Nút quay lại */}
                <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
                    ← Quay lại Dashboard
                </Link>

                {/* Header Mục tiêu */}
                <div className="bg-white p-8 rounded-lg shadow-md mb-8 border-l-8 border-blue-600">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{goal.title}</h1>
                    <p className="text-gray-600">{goal.description}</p>
                    <div className="mt-4 flex gap-2">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-semibold">
                            Status: {goal.status}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* CỘT TRÁI: Quản lý Input (Resources) */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                                📥 Nạp Kiến Thức (Input)
                            </h2>

                            {/* Form thêm tài liệu mới */}
                            <form onSubmit={handleAddResource} className="flex flex-col gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">

                                {/* 1. Chọn loại Input */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Loại tài liệu</label>
                                    <select
                                        className="w-full border p-2 rounded text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={resType}
                                        onChange={(e) => setResType(e.target.value)}
                                    >
                                        <option value="TEXT">📝 Văn bản / Ghi chú (Text)</option>
                                        <option value="URL" className="text-gray-400">🔗 Link Website (Đang phát triển)</option>
                                        <option value="VIDEO" className="text-gray-400">🎥 YouTube Video (Đang phát triển)</option>
                                        <option value="IMAGE" className="text-gray-400">🖼️ Hình ảnh (Đang phát triển)</option>
                                    </select>
                                </div>

                                {/* 2. Nhập tiêu đề */}
                                <input
                                    type="text"
                                    placeholder="Tiêu đề (VD: Khái niệm về React State)"
                                    className="w-full border p-2 rounded text-sm text-black focus:outline-none focus:border-blue-500"
                                    value={newResTitle}
                                    onChange={e => setNewResTitle(e.target.value)}
                                    required
                                />

                                {/* 3. Logic hiển thị theo loại */}
                                {resType === 'TEXT' ? (
                                    <textarea
                                        placeholder="Dán nội dung bài học, đoạn văn, hoặc ghi chú nhanh vào đây..."
                                        className="w-full border p-2 rounded text-sm text-black h-32 focus:outline-none focus:border-blue-500"
                                        value={resContent}
                                        onChange={e => setResContent(e.target.value)}
                                    ></textarea>
                                ) : (
                                    <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200 flex items-center gap-2">
                                        🚧 Tính năng này đang được xây dựng. Vui lòng quay lại sau hoặc chọn "Văn bản".
                                    </div>
                                )}

                                {/* Nút Submit */}
                                <button
                                    type="submit"
                                    disabled={resType !== 'TEXT'}
                                    className={`w-full py-2 rounded text-sm font-bold transition-all ${resType === 'TEXT'
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    {resType === 'TEXT' ? '+ Lưu Kiến Thức' : 'Chưa khả dụng'}
                                </button>
                            </form>

                            {/* Danh sách tài liệu cũ */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase">Danh sách đã lưu</h3>
                                {resources.map(res => (
                                    <div key={res.id} className="group relative p-3 bg-white border border-gray-200 rounded hover:shadow-sm hover:border-blue-300 transition">
                                        <div className="font-medium text-gray-800 truncate pr-6">
                                            {res.title}
                                        </div>

                                        {/* Hiển thị tóm tắt nội dung */}
                                        {res.content && (
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 bg-gray-50 p-1 rounded">
                                                {res.content}
                                            </p>
                                        )}

                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                {res.type}
                                            </span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded border ${res.status === 'MASTERED' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                                                {res.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {resources.length === 0 && <p className="text-sm text-gray-400 italic">Chưa có tài liệu nào.</p>}
                            </div>
                        </div>
                    </div>

                    {/* CỘT PHẢI: Khu vực Sáng tạo (Output) */}
                    <div className="lg:col-span-2">
                        <div className="bg-white p-6 rounded-lg shadow h-full flex flex-col justify-center items-center text-center border-2 border-dashed border-gray-300">
                            <div className="p-6">
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">2. Chế Biến & Sáng Tạo</h2>
                                <p className="text-gray-500 mb-6 max-w-md">
                                    Đừng chỉ đọc. Hãy chọn các tài liệu bên trái và viết bài phân tích để thực sự hiểu sâu (Deep Work).
                                </p>
                                <Link
                                    href={`/write?goalId=${id}`}
                                    className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 shadow-lg transform hover:scale-105 transition"
                                >
                                    ✍️ Viết Bài Đúc Kết Ngay
                                </Link>

                                <div className="mt-10 w-full text-left">
                                    <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Các bài đúc kết đã viết</h3>
                                    <div className="grid gap-4">
                                        {Array.isArray(posts) && posts.map(post => (
                                            <div key={post.id} className="bg-gray-50 p-4 rounded border hover:border-blue-300 transition cursor-pointer">
                                                <h4 className="font-bold text-lg text-gray-900">{post.title}</h4>
                                                <p className="text-gray-600 text-sm mt-1 line-clamp-2">{post.content}</p>
                                                <p className="text-xs text-gray-400 mt-2">{new Date(post.created_at).toLocaleDateString()}</p>
                                            </div>
                                        ))}
                                        {posts.length === 0 && <p className="text-gray-400 italic">Chưa có bài viết nào.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
