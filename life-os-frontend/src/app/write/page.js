"use client";
import React, { useState, useEffect } from 'react';

export default function WritePage() {
    const [resources, setResources] = useState([]);
    const [selectedResource, setSelectedResource] = useState(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(false);
    const [publishStatus, setPublishStatus] = useState("idle"); // idle, success, error

    useEffect(() => {
        // Fetch resources
        fetch('http://localhost:8080/api/resources') // Adjust URL if needed
            .then(res => res.json())
            .then(data => setResources(data))
            .catch(err => console.error("Failed to fetch resources", err));
    }, []);

    const handleReview = async () => {
        setLoading(true);
        setFeedback("");
        try {
            const res = await fetch('http://localhost:8080/api/posts/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    resourceContext: selectedResource ? selectedResource.url + "\n" + selectedResource.title : ""
                })
            });
            const data = await res.json();
            setFeedback(data.feedback);
        } catch (err) {
            console.error("Review failed", err);
            setFeedback("Error getting review.");
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!title.trim()) {
            alert("Please enter a title for your note.");
            return;
        }
        try {
            const res = await fetch('http://localhost:8080/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content,
                    goal_id: selectedResource?.goal_id || null
                })
            });
            if (res.ok) {
                setPublishStatus("success");
                setTimeout(() => setPublishStatus("idle"), 3000);
            }
        } catch (err) {
            console.error(err);
            setPublishStatus("error");
        }
    };

    return (
        <div className="flex h-screen bg-neutral-50 text-slate-900 font-sans">
            {/* Left Pane: Resources */}
            <div className="w-1/2 flex flex-col border-r border-gray-200 bg-white shadow-sm z-10">
                <div className="p-6 border-b border-gray-100">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Input Source</label>
                    <select
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                        onChange={(e) => {
                            const res = resources.find(r => r.id === parseInt(e.target.value));
                            setSelectedResource(res);
                            // Auto-set title if empty
                            if (res && !title) setTitle(`Notes on: ${res.title}`);
                        }}
                    >
                        <option value="">-- Select a Resource to Study --</option>
                        {resources.map(r => (
                            <option key={r.id} value={r.id}>{r.title} ({r.type || 'TEXT'})</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 overflow-hidden relative bg-gray-50/50">
                    {selectedResource ? (
                        selectedResource.type === 'VIDEO' || (selectedResource.url && selectedResource.url.includes('youtube')) ? (
                            <iframe
                                src={selectedResource.url.replace("watch?v=", "embed/")}
                                className="w-full h-full"
                                frameBorder="0"
                                allowFullScreen
                                title="Resource Video"
                            />
                        ) : selectedResource.content ? (
                            <div className="p-8 h-full overflow-auto prose prose-slate max-w-none">
                                <h2 className="text-xl font-bold mb-4">{selectedResource.title}</h2>
                                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                                    {selectedResource.content}
                                </div>
                                <div className="mt-8 pt-4 border-t border-gray-200">
                                    <a href={selectedResource.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-2">
                                        Open Original Source ↗
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <span className="text-2xl">📄</span>
                                </div>
                                <h3 className="font-bold text-lg text-gray-700 mb-2">{selectedResource.title}</h3>
                                <p className="mb-6 max-w-sm">This resource is an external link. We can't preview it here directly due to security policies.</p>
                                <a
                                    href={selectedResource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    Open Link in New Tab
                                </a>
                            </div>
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <svg className="w-16 h-16 mb-4 opacity-20" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                            </svg>
                            <p className="font-medium">Select a resource to begin your deep learning session</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Pane: Editor & Review */}
            <div className="w-1/2 flex flex-col h-full">
                <div className="p-8 flex-1 flex flex-col max-w-3xl mx-auto w-full">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                            Deep Learning Editor
                        </h1>
                        <span className="text-xs font-medium px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                            Feynman Technique
                        </span>
                    </div>

                    <div className="mb-6 space-y-4">
                        <input
                            type="text"
                            placeholder="Title your concept..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full text-3xl font-bold text-slate-800 placeholder-gray-300 border-none outline-none bg-transparent focus:ring-0 px-0"
                        />
                        <div className="h-px w-full bg-gray-100"></div>
                    </div>

                    <textarea
                        className="flex-1 w-full p-4 text-lg text-slate-700 placeholder-gray-300 resize-none focus:outline-none bg-white/50 rounded-xl hover:bg-white transition-colors"
                        placeholder="Start explaining the concept as if you were teaching it to a 5-year-old..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />

                    {/* Feedback Area - Only shows when there is feedback */}
                    {feedback && (
                        <div className="mb-4 mt-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-6 rounded-2xl shadow-sm animate-fade-in">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    🤖
                                </div>
                                <h3 className="font-bold text-indigo-900">Socratic Feedback</h3>
                            </div>
                            <div className="prose prose-sm prose-indigo whitespace-pre-wrap text-slate-700">
                                {feedback}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 mt-6 pt-6 border-t border-gray-100">
                        <button
                            onClick={handleReview}
                            disabled={loading}
                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all transform hover:-translate-y-1 ${loading
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-white border-2 border-indigo-100 text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 shadow-sm"
                                }`}
                        >
                            {loading ? (
                                <>Thinking...</>
                            ) : (
                                <>
                                    <span className="text-xl">🎓</span>
                                    Get Socratic Review
                                </>
                            )}
                        </button>
                        <button
                            onClick={handlePublish}
                            disabled={publishStatus === 'success'}
                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-white shadow-lg transition-all transform hover:-translate-y-1 ${publishStatus === 'success'
                                    ? "bg-green-500 hover:bg-green-600"
                                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-200"
                                }`}
                        >
                            {publishStatus === 'success' ? (
                                <>✓ Published!</>
                            ) : (
                                <>
                                    <span className="text-xl">🚀</span>
                                    Publish to Brain
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
