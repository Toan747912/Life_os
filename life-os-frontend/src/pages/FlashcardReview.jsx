import React, { useState, useEffect } from 'react';
import { flashcardApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

const FlashcardReview = () => {
    const [dueCards, setDueCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadDueCards();
    }, []);

    const loadDueCards = async () => {
        try {
            setLoading(true);
            const res = await flashcardApi.getDue();
            setDueCards(res.data.data);
        } catch (error) {
            console.error('Error loading due flashcards:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (quality) => {
        const card = dueCards[currentIndex];
        try {
            await flashcardApi.review(card.id, quality);

            // Move to next card
            setShowAnswer(false);
            if (currentIndex + 1 < dueCards.length) {
                setCurrentIndex(currentIndex + 1);
            } else {
                // Done with all cards
                setDueCards([]);
                setCurrentIndex(0);
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Lỗi lưu kết quả, vui lòng thử lại');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (dueCards.length === 0 || currentIndex >= dueCards.length) {
        return (
            <div className="max-w-2xl mx-auto p-4 mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
                <div className="bg-white rounded-3xl p-12 shadow-xl border border-slate-100 flex flex-col items-center">
                    <div className="text-8xl mb-6">🎉</div>
                    <h2 className="text-3xl font-extrabold text-slate-800 mb-4">Chúc mừng!</h2>
                    <p className="text-lg text-slate-500 mb-8">Bạn đã hoàn thành tất cả các từ vựng cần ôn tập hôm nay.</p>
                    <button
                        onClick={() => navigate('/vocabulary')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/30"
                    >
                        Trở về Sổ tay từ vựng
                    </button>
                </div>
            </div>
        );
    }

    const currentCard = dueCards[currentIndex];

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => navigate('/vocabulary')}
                    className="text-slate-500 hover:text-indigo-600 font-medium transition-colors"
                >
                    &larr; Quay lại
                </button>
                <div className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full font-bold text-sm">
                    {currentIndex + 1} / {dueCards.length}
                </div>
            </div>

            {/* Flashcard Container */}
            <div className="relative w-full aspect-[4/3] md:aspect-[16/9] perspective-1000">
                <div className={`w-full h-full transition-transform duration-700 transform-style-3d ${showAnswer ? 'rotate-y-180' : ''}`}>

                    {/* Front Face */}
                    <div className="absolute w-full h-full backface-hidden bg-white rounded-3xl p-8 flex flex-col items-center justify-center shadow-xl border border-slate-100 cursor-pointer"
                        onClick={() => !showAnswer && setShowAnswer(true)}>
                        <h2 className="text-5xl md:text-6xl font-black text-slate-800 text-center select-none">
                            {currentCard.item.term}
                        </h2>
                        {!showAnswer && (
                            <p className="text-slate-400 mt-12 animate-pulse absolute bottom-8">
                                Nhấn vào thẻ để xem đáp án
                            </p>
                        )}
                    </div>

                    {/* Back Face */}
                    <div className="absolute w-full h-full backface-hidden bg-indigo-50 rounded-3xl p-8 flex flex-col items-center justify-center shadow-xl border border-indigo-100 rotate-y-180 overflow-y-auto">
                        <h2 className="text-4xl md:text-5xl font-black text-indigo-900 mb-6 text-center">
                            {currentCard.item.term}
                        </h2>
                        {currentCard.item.definition && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm w-full max-w-lg mb-4 text-center border border-indigo-50">
                                <p className="text-lg text-slate-700 font-medium">{currentCard.item.definition}</p>
                            </div>
                        )}
                        {currentCard.item.exampleSentence && (
                            <div className="bg-white/60 p-5 rounded-2xl w-full max-w-lg text-center">
                                <p className="text-md text-slate-600 italic">"{currentCard.item.exampleSentence}"</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            {showAnswer && (
                <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <button
                        onClick={() => handleReview(1)}
                        className="flex flex-col items-center py-4 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl transition-all border border-rose-200 shadow-sm active:scale-95"
                    >
                        <span className="font-bold text-lg mb-1">Quên (Again)</span>
                        <span className="text-xs opacity-70">1 phút / 10 phút</span>
                    </button>
                    <button
                        onClick={() => handleReview(3)}
                        className="flex flex-col items-center py-4 px-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-2xl transition-all border border-orange-200 shadow-sm active:scale-95"
                    >
                        <span className="font-bold text-lg mb-1">Khó (Hard)</span>
                        <span className="text-xs opacity-70">Lâu hơn chút</span>
                    </button>
                    <button
                        onClick={() => handleReview(4)}
                        className="flex flex-col items-center py-4 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl transition-all border border-blue-200 shadow-sm active:scale-95"
                    >
                        <span className="font-bold text-lg mb-1">Tốt (Good)</span>
                        <span className="text-xs opacity-70">Bình thường</span>
                    </button>
                    <button
                        onClick={() => handleReview(5)}
                        className="flex flex-col items-center py-4 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-2xl transition-all border border-emerald-200 shadow-sm active:scale-95"
                    >
                        <span className="font-bold text-lg mb-1">Dễ (Easy)</span>
                        <span className="text-xs opacity-70">Rất lâu sau</span>
                    </button>
                </div>
            )}

            {/* CSS for 3D flip card */}
            <style jsx>{`
                .perspective-1000 {
                    perspective: 1000px;
                }
                .transform-style-3d {
                    transform-style: preserve-3d;
                }
                .backface-hidden {
                    backface-visibility: hidden;
                }
                .rotate-y-180 {
                    transform: rotateY(180deg);
                }
            `}</style>
        </div>
    );
};

export default FlashcardReview;
