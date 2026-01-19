import api from '@/lib/axios';
import { Activity, CreateActivityDto, UpdateActivityDto } from '@/types/activity';

export const activityService = {
    getAll: async (): Promise<Activity[]> => {
        const response = await api.get('/activities');
        return response.data;
    },

    create: async (data: CreateActivityDto): Promise<Activity> => {
        const response = await api.post('/activities', data);
        return response.data;
    },

    update: async (id: string, data: UpdateActivityDto): Promise<Activity> => {
        const response = await api.patch(`/activities/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/activities/${id}`);
    },
};
