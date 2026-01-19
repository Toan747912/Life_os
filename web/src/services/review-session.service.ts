import api from '@/lib/axios';
import { CreateReviewSessionDto, ReviewSession } from '@/types/review-session';

export const reviewSessionService = {
    create: async (data: CreateReviewSessionDto): Promise<ReviewSession> => {
        const response = await api.post('/learning-sessions', data);
        return response.data;
    },
};
