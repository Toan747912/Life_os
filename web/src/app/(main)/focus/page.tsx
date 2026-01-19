import { FocusTimer } from "@/components/focus/FocusTimer";
import { FocusStats } from "@/components/focus/FocusStats";

export default function FocusPage() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight">Focus Mode</h1>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <FocusTimer />
                </div>
                <div className="lg:col-span-1">
                    <FocusStats />
                </div>
            </div>
        </div>
    );
}
