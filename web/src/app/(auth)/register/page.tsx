"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import api from "@/lib/axios";

const registerSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    username: z.string().min(2, { message: "Username must be at least 2 characters" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: "",
            username: "",
            password: "",
        },
    });

    const { mutate, isPending } = useMutation({
        mutationFn: async (data: RegisterFormValues) => {
            const response = await api.post("/auth/register", data);
            return response.data;
        },
        onSuccess: () => {
            // After registration, redirect to login
            router.push("/login?registered=true");
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        },
    });

    const onSubmit = (data: RegisterFormValues) => {
        setError(null);
        mutate(data);
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-2xl">Create an account</CardTitle>
                <CardDescription>
                    Enter your email below to create your account.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            placeholder="m@example.com"
                            type="email"
                            disabled={isPending}
                            {...form.register("email")}
                        />
                        {form.formState.errors.email && (
                            <p className="text-sm text-red-500">
                                {form.formState.errors.email.message}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            placeholder="johndoe"
                            type="text"
                            disabled={isPending}
                            {...form.register("username")}
                        />
                        {form.formState.errors.username && (
                            <p className="text-sm text-red-500">
                                {form.formState.errors.username.message}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            disabled={isPending}
                            {...form.register("password")}
                        />
                        {form.formState.errors.password && (
                            <p className="text-sm text-red-500">
                                {form.formState.errors.password.message}
                            </p>
                        )}
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button className="w-full" type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign Up
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                        Sign in
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
