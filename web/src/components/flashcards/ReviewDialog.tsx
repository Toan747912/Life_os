"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { flashcardService } from "@/services/flashcard.service";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ReviewDialog({ open, onOpenChange }: ReviewDialogProps) {
    const queryClient = useQueryClient();
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const { data: dueCards, isLoading } = useQuery({
        queryKey: ["due-flashcards"],
        queryFn: flashcardService.getDue,
        enabled: open,
    });

    const { mutate: reviewCard, isPending } = useMutation({
        mutationFn: async ({ id, quality }: { id: string; quality: number }) => {
            return flashcardService.review(id, quality);
        },
        onSuccess: () => {
            if (dueCards && currentCardIndex < dueCards.length - 1) {
                setCurrentCardIndex((prev) => prev + 1);
                setIsFlipped(false);
            } else {
                // Finished all cards
                queryClient.invalidateQueries({ queryKey: ["flashcards"] });
                queryClient.invalidateQueries({ queryKey: ["due-flashcards"] });
                onOpenChange(false);
                setCurrentCardIndex(0);
                setIsFlipped(false);
            }
        },
    });

    const currentCard = dueCards?.[currentCardIndex];

    const handleRating = (quality: number) => {
        if (currentCard) {
            reviewCard({ id: currentCard.id, quality });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Review Due Cards</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                ) : !dueCards || dueCards.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                        No cards due for review! Good job.
                    </div>
                ) : (
                    <div className="flex flex-col gap-6 items-center">
                        <div className="text-sm text-muted-foreground w-full text-right">
                            Card {currentCardIndex + 1} of {dueCards.length}
                        </div>

                        <div
                            className="relative w-full h-64 perspective-1000 cursor-pointer group"
                            onClick={() => setIsFlipped(!isFlipped)}
                        >
                            <div className={cn(
                                "relative w-full h-full duration-500 transform-style-3d transition-transform",
                                isFlipped ? "rotate-y-180" : ""
                            )}>
                                {/* Front */}
                                <Card className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 text-center text-xl font-medium">
                                    {currentCard?.frontContent}
                                </Card>
                                {/* Back */}
                                <Card className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center p-6 text-center text-xl font-medium bg-muted">
                                    {currentCard?.backContent}
                                </Card>
                            </div>
                        </div>

                        {isFlipped ? (
                            <div className="grid grid-cols-4 gap-2 w-full">
                                <Button variant="destructive" onClick={() => handleRating(0)} disabled={isPending}>Result 0</Button>
                                <Button variant="secondary" onClick={() => handleRating(3)} disabled={isPending}>Hard</Button>
                                <Button variant="outline" onClick={() => handleRating(4)} disabled={isPending}>Good</Button>
                                <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleRating(5)} disabled={isPending}>Easy</Button>
                            </div>
                        ) : (
                            <Button className="w-full" onClick={() => setIsFlipped(true)}>Show Answer</Button>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
