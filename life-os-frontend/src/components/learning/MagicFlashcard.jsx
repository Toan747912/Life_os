import React from 'react';
import { Volume2, BookOpen, Quote, Info } from 'lucide-react';

const MagicFlashcard = ({ data, onSpeak }) => {
    if (!data) return null;

    const extraInfo = typeof data.extraInfo === 'string' ? JSON.parse(data.extraInfo) : data.extraInfo;

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transition-all hover:shadow-2xl max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-indigo-100">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-3xl font-bold font-serif text-gray-900 mb-2">
                            {data.term}
                        </h3>
                        <div className="flex items-center gap-3 text-sm">
                            {extraInfo?.phonetic && (
                                <span className="text-gray-600 font-mono bg-white px-2 py-1 rounded-md border border-gray-200">
                                    {extraInfo.phonetic}
                                </span>
                            )}
                            {extraInfo?.hanViet && (
                                <span className="text-indigo-700 font-medium bg-indigo-100 px-2 py-1 rounded-md">
                                    {extraInfo.hanViet}
                                </span>
                            )}
                            {extraInfo?.partOfSpeech && (
                                <span className="text-purple-700 font-medium bg-purple-100 px-2 py-1 rounded-md italic">
                                    {extraInfo.partOfSpeech}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => onSpeak && onSpeak(data.term)}
                        className="p-3 bg-white hover:bg-indigo-50 rounded-full shadow-sm text-indigo-600 transition-colors"
                        title="Nghe phát âm"
                    >
                        <Volume2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Body Section */}
            <div className="p-6 space-y-6">
                {/* Main Meaning */}
                <div>
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <BookOpen className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider font-semibold">Nghĩa</span>
                    </div>
                    <p className="text-xl text-gray-800">{data.definition}</p>
                </div>

                {/* Example Sentence */}
                {data.exampleSentence && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative">
                        <Quote className="absolute top-4 left-4 w-8 h-8 text-gray-200" />
                        <div className="pl-10 relative z-10">
                            <p className="text-gray-900 font-serif italic mb-2 text-lg">"{data.exampleSentence}"</p>
                            {extraInfo?.exampleTranslation && (
                                <p className="text-gray-500 text-sm">{extraInfo.exampleTranslation}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Nuance / Context Note (Highlight Section) */}
                {extraInfo?.contextualNuance && (
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 shadow-inner">
                        <div className="flex items-center gap-2 text-amber-800 mb-2">
                            <Info className="w-5 h-5" />
                            <span className="font-semibold uppercase text-sm tracking-wide">Ngữ cảnh tinh tế</span>
                        </div>
                        <p className="text-amber-900 italic leading-relaxed text-sm">
                            {extraInfo.contextualNuance}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MagicFlashcard;
