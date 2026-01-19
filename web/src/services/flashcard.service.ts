import api from "@/lib/axios";

export enum CardType {
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    CODE = 'CODE',
}

export interface Flashcard {
    id: string;
    frontContent: string;
    backContent: string;
    cardType: CardType;
    interval: number;
    repetition: number;
    easeFactor: number;
    nextReviewDate: string;
    userId: string;
    noteId?: string;
    createdAt: string;
}

export interface CreateFlashcardDto {
    frontContent: string;
    backContent: string;
    cardType?: CardType;
    noteId?: string;
}

export interface ReviewFlashcardDto {
    quality: number; // 0-5
}

export const flashcardService = {
    getAll: async (): Promise<Flashcard[]> => {
        const response = await api.get("/flashcards");
        return response.data;
    },

    getDue: async (): Promise<Flashcard[]> => {
        const response = await api.get("/flashcards/due");
        return response.data;
    },

    create: async (data: CreateFlashcardDto): Promise<Flashcard> => {
        const response = await api.post("/flashcards", data);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateFlashcardDto>): Promise<Flashcard> => {
        const response = await api.patch(`/flashcards/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/flashcards/${id}`);
    },

    review: async (id: string, quality: number): Promise<Flashcard> => {
        const response = await api.post(`/flashcards/${id}/review`, { quality });
        return response.data;
    },
};
