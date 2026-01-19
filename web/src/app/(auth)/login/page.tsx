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
import { useAuthStore } from "@/store/auth.store";

const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const { mutate, isPending } = useMutation({
        mutationFn: async (data: LoginFormValues) => {
            const response = await api.post("/auth/login", data);
            return response.data;
        },
        onSuccess: (data) => {
            // Assuming backend returns { access_token: string }
            // We don't have full user object yet, so we might need to fetch profile or decode token
            // For now, let's create a partial user from the email or fetch profile next.
            // But typically login returns user + token or just token. 
            // Based on auth.controller, it returns what `authService.login` returns.
            // Let's assume it returns { access_token }.

            const token = data.access_token;

            // We can decode token or fetch profile here, but for simplicity let's save token first.
            // We will perform a simple mock user or fetch profile immediately.
            // Ideally we should have a `useUser` hook that fetches profile on mount if token exists.

            // For this step, let's just save token and redirect.
            login({ id: "temp", email: form.getValues().email, username: "User" }, token);
            router.push("/");
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        },
    });

    const onSubmit = (data: LoginFormValues) => {
        setError(null);
        mutate(data);
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-2xl">Login</CardTitle>
                <CardDescription>
                    Enter your email below to login to your account.
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
                        Sign In
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-primary hover:underline">
                        Sign up
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
