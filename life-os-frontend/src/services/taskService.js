import api from './api';

const taskService = {
    getDailyTasks: async (userId, date) => {
        const response = await api.get('/tasks', {
            params: { userId, date },
        });
        return response.data;
    },

    toggleTask: async (taskId, userId) => {
        const response = await api.patch(`/tasks/${taskId}/toggle`, {
            userId,
        });
        return response.data;
    },
};

export default taskService;
