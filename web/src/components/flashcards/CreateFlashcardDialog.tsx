"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { flashcardService } from "@/services/flashcard.service";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const createFlashcardSchema = z.object({
    frontContent: z.string().min(1, "Front is required"),
    backContent: z.string().min(1, "Back is required"),
});

type CreateFlashcardFormValues = z.infer<typeof createFlashcardSchema>;

interface CreateFlashcardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateFlashcardDialog({
    open,
    onOpenChange,
}: CreateFlashcardDialogProps) {
    const queryClient = useQueryClient();
    const form = useForm<CreateFlashcardFormValues>({
        resolver: zodResolver(createFlashcardSchema),
        defaultValues: {
            frontContent: "",
            backContent: "",
        },
    });

    const { mutate, isPending } = useMutation({
        mutationFn: async (data: CreateFlashcardFormValues) => {
            return flashcardService.create(data);
        },
        onSuccess: () => {
            form.reset();
            queryClient.invalidateQueries({ queryKey: ["flashcards"] });
            queryClient.invalidateQueries({ queryKey: ["due-flashcards"] });
            onOpenChange(false);
        },
    });

    const onSubmit = (data: CreateFlashcardFormValues) => {
        mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Flashcard</DialogTitle>
                    <DialogDescription>
                        Create a new flashcard to review later.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="front">Front</Label>
                            <Textarea
                                id="front"
                                placeholder="Question or Term"
                                disabled={isPending}
                                {...form.register("frontContent")}
                            />
                            {form.formState.errors.frontContent && (
                                <p className="text-sm text-red-500">{form.formState.errors.frontContent.message}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="back">Back</Label>
                            <Textarea
                                id="back"
                                placeholder="Answer or Definition"
                                disabled={isPending}
                                {...form.register("backContent")}
                            />
                            {form.formState.errors.backContent && (
                                <p className="text-sm text-red-500">{form.formState.errors.backContent.message}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Card
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
