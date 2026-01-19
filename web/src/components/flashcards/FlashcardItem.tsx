"use client";

import { useState } from "react";
import { Flashcard } from "@/services/flashcard.service";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FlashcardItemProps {
    flashcard: Flashcard;
}

export function FlashcardItem({ flashcard }: FlashcardItemProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div
            className="relative w-full h-48 cursor-pointer perspective-1000 group"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <div
                className={cn(
                    "relative w-full h-full duration-500 transform-style-3d transition-transform",
                    isFlipped ? "rotate-y-180" : ""
                )}
            >
                {/* Front */}
                <Card className="absolute w-full h-full backface-hidden flex items-center justify-center p-4 text-center">
                    <CardContent>
                        <div className="font-medium text-lg">{flashcard.frontContent}</div>
                    </CardContent>
                </Card>

                {/* Back */}
                <Card className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center p-4 text-center bg-muted">
                    <CardContent>
                        <div className="font-medium text-lg">{flashcard.backContent}</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
