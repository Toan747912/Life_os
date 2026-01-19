import api from "@/lib/axios";

export enum FocusSessionStatus {
    COMPLETED = 'completed',
    INTERRUPTED = 'interrupted',
}

export interface CreateFocusSessionDto {
    startTime: string; // ISO Date
    endTime: string; // ISO Date
    duration: number; // in seconds
    status: FocusSessionStatus;
    linkedEntityId?: string;
}

export interface FocusSession {
    id: string;
    userId: string;
    startTime: string;
    endTime: string;
    duration: number;
    status: FocusSessionStatus;
    linkedEntityId?: string;
    createdAt: string;
}

export interface FocusStats {
    totalSessions: number;
    totalDuration: number;
    // add other stats fields from backend if any
}

export const focusService = {
    createSession: async (data: CreateFocusSessionDto): Promise<FocusSession> => {
        const response = await api.post("/focus/sessions", data);
        return response.data;
    },

    getAllSessions: async (): Promise<FocusSession[]> => {
        const response = await api.get("/focus/sessions");
        return response.data;
    },

    getStats: async (): Promise<FocusStats> => {
        const response = await api.get("/focus/stats");
        return response.data;
    },
};
