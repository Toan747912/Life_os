// src/app/page.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
    const [goals, setGoals] = useState([]);
    const [newGoalTitle, setNewGoalTitle] = useState("");
    const [loading, setLoading] = useState(true);

    // 1. Hàm gọi API lấy danh sách Goals từ Backend
    const fetchGoals = async () => {
        try {
            const res = await fetch("http://localhost:8080/api/goals");
            const data = await res.json();
            setGoals(data);
            setLoading(false);
        } catch (error) {
            console.error("Lỗi kết nối Backend:", error);
            setLoading(false);
        }
    };

    // 2. Gọi hàm fetchGoals khi trang vừa load xong
    useEffect(() => {
        fetchGoals();
    }, []);

    // 3. Hàm xử lý khi nhấn nút "Thêm mục tiêu"
    const handleAddGoal = async (e) => {
        e.preventDefault(); // Chặn reload trang
        if (!newGoalTitle) return;

        try {
            const res = await fetch("http://localhost:8080/api/goals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newGoalTitle,
                    description: "Mô tả mặc định" // Tạm thời hardcode
                }),
            });

            if (res.ok) {
                setNewGoalTitle(""); // Xóa ô nhập liệu
                fetchGoals(); // Load lại danh sách mới
            }
        } catch (error) {
            console.error("Lỗi khi thêm goal:", error);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto" suppressHydrationWarning={true}>

                {/* Header */}
                <header className="mb-10 text-center">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">My Life OS</h1>
                    <p className="text-gray-500">Hệ thống quản lý Học tập & Sáng tạo</p>
                    <div className="mt-4 flex gap-4 justify-center" suppressHydrationWarning={true}>
                        <Link href="/write" className="text-blue-600 hover:underline border px-3 py-1 rounded hover:bg-blue-50">
                            📝 Write (Deep Learning)
                        </Link>
                        <Link href="/brain" className="text-purple-600 hover:underline border px-3 py-1 rounded hover:bg-purple-50">
                            🧠 Brain Map
                        </Link>
                    </div>
                </header>

                {/* Form thêm mục tiêu */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-8" suppressHydrationWarning={true}>
                    <form onSubmit={handleAddGoal} className="flex gap-4">
                        <input
                            type="text"
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            placeholder="Bạn muốn học gì hôm nay? (VD: Master Next.js)"
                            value={newGoalTitle}
                            onChange={(e) => setNewGoalTitle(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                        >
                            + Thêm
                        </button>
                    </form>
                </div>

                {/* Danh sách mục tiêu */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Mục tiêu hiện tại</h2>

                    {loading ? (
                        <p className="text-center text-gray-500">Đang tải dữ liệu...</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {goals.map((goal) => (
                                <Link href={`/goals/${goal.id}`} key={goal.id} className="block">
                                    <div className="bg-white p-6 rounded-lg shadow border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer h-full" suppressHydrationWarning={true}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-xl font-semibold text-gray-800">{goal.title}</h3>
                                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                                {goal.status}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-4">
                                            {goal.description || "Chưa có mô tả"}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Tạo ngày: {new Date(goal.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {!loading && goals.length === 0 && (
                        <p className="text-center text-gray-400 mt-10">Chưa có mục tiêu nào. Hãy tạo cái đầu tiên đi!</p>
                    )}
                </div>

            </div>
        </main>
    );
}
