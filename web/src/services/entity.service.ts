import api from "@/lib/axios";

export interface EntityData {
    title?: string;
    description?: string;
    status?: 'todo' | 'in_progress' | 'done';
    priority?: 'low' | 'medium' | 'high';
    // dictionary for flexible data
    [key: string]: any;
}

export interface Entity {
    id: string;
    type: string; // 'task' | 'project' | 'note'
    data: EntityData;
    workspaceId: string;
    parentId?: string;
    position?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateEntityDto {
    type: string;
    data: EntityData;
    parentId?: string;
    position?: string;
}

export interface UpdateEntityDto {
    data?: EntityData;
    parentId?: string;
    position?: string;
}

export const entityService = {
    getAll: async (workspaceId: string): Promise<Entity[]> => {
        const response = await api.get(`/workspaces/${workspaceId}/entities`);
        return response.data;
    },

    create: async (workspaceId: string, data: CreateEntityDto): Promise<Entity> => {
        const response = await api.post(`/workspaces/${workspaceId}/entities`, data);
        return response.data;
    },

    getOne: async (id: string): Promise<Entity> => {
        const response = await api.get(`/entities/${id}`);
        return response.data;
    },

    update: async (id: string, data: Partial<UpdateEntityDto>): Promise<Entity> => {
        const response = await api.patch(`/entities/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/entities/${id}`);
    },
};
