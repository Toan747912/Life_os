"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { flashcardService } from "@/services/flashcard.service";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";
import { FlashcardItem } from "@/components/flashcards/FlashcardItem";
import { CreateFlashcardDialog } from "@/components/flashcards/CreateFlashcardDialog";
import { ReviewDialog } from "@/components/flashcards/ReviewDialog";

export default function FlashcardsPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    const { data: flashcards, isLoading } = useQuery({
        queryKey: ["flashcards"],
        queryFn: flashcardService.getAll,
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsReviewOpen(true)}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Review
                    </Button>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Card
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div>Loading flashcards...</div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {flashcards?.length === 0 ? (
                        <div className="col-span-full text-center text-muted-foreground py-10">
                            No flashcards created yet.
                        </div>
                    ) : (
                        flashcards?.map((card) => (
                            <FlashcardItem key={card.id} flashcard={card} />
                        ))
                    )}
                </div>
            )}

            <CreateFlashcardDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            />
            <ReviewDialog
                open={isReviewOpen}
                onOpenChange={setIsReviewOpen}
            />
        </div>
    );
}
