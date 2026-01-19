import api from "@/lib/axios";

export interface Workspace {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    // add other fields if necessary
}

export interface CreateWorkspaceDto {
    name: string;
    description?: string;
}

export const workspaceService = {
    getAll: async (): Promise<Workspace[]> => {
        const response = await api.get("/workspaces");
        return response.data;
    },

    create: async (data: CreateWorkspaceDto): Promise<Workspace> => {
        const response = await api.post("/workspaces", data);
        return response.data;
    },
};
