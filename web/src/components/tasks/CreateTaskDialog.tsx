"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { entityService } from "@/services/entity.service";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const createTaskSchema = z.object({
    title: z.string().min(1, "Title is required"),
});

type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

interface CreateTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    workspaceId: string;
}

export function CreateTaskDialog({
    open,
    onOpenChange,
    onSuccess,
    workspaceId,
}: CreateTaskDialogProps) {
    const form = useForm<CreateTaskFormValues>({
        resolver: zodResolver(createTaskSchema),
        defaultValues: {
            title: "",
        },
    });

    const { mutate, isPending } = useMutation({
        mutationFn: async (data: CreateTaskFormValues) => {
            return entityService.create(workspaceId, {
                type: "task",
                data: {
                    title: data.title,
                    status: "todo",
                },
            });
        },
        onSuccess: () => {
            form.reset();
            onOpenChange(false);
            onSuccess();
        },
    });

    const onSubmit = (data: CreateTaskFormValues) => {
        mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Task</DialogTitle>
                    <DialogDescription>
                        Create a new task to your workspace.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">
                                Title
                            </Label>
                            <Input
                                id="title"
                                className="col-span-3"
                                disabled={isPending}
                                {...form.register("title")}
                            />
                        </div>
                        {form.formState.errors.title && (
                            <p className="text-sm text-red-500 text-right">
                                {form.formState.errors.title.message}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
