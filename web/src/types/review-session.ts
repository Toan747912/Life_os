export interface ReviewSession {
    id: number;
    activityId: string;
    mode: 'READ' | 'FIRST_LETTER' | 'CLOZE' | 'QUIZ' | 'SCRAMBLE';
    score: number;
    durationSeconds: number;
    mistakeDetailsJson?: string;
    createdAt: string;
    syncedAt?: string;
}

export interface CreateReviewSessionDto {
    activityId: string; // The UUID of the activity
    mode: 'READ' | 'FIRST_LETTER' | 'CLOZE' | 'QUIZ' | 'SCRAMBLE';
    score: number;
    durationSeconds: number;
    mistakes: string[]; // Array of strings (mistake details)
}
