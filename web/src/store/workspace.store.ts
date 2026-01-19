import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workspace, workspaceService } from '@/services/workspace.service';

interface WorkspaceState {
    workspaces: Workspace[];
    activeWorkspaceId: string | null;
    isLoading: boolean;
    error: string | null;

    fetchWorkspaces: () => Promise<void>;
    setActiveWorkspace: (id: string) => void;
    createWorkspace: (name: string, description?: string) => Promise<void>;

    // Computed (helper)
    getActiveWorkspace: () => Workspace | undefined;
}

export const useWorkspaceStore = create<WorkspaceState>()(
    persist(
        (set, get) => ({
            workspaces: [],
            activeWorkspaceId: null,
            isLoading: false,
            error: null,

            fetchWorkspaces: async () => {
                set({ isLoading: true, error: null });
                try {
                    const workspaces = await workspaceService.getAll();
                    set({ workspaces: workspaces, isLoading: false });

                    // Auto-select first workspace if none selected or selected invalid
                    const currentId = get().activeWorkspaceId;
                    if (workspaces.length > 0) {
                        const exist = workspaces.find(w => w.id === currentId);
                        if (!currentId || !exist) {
                            set({ activeWorkspaceId: workspaces[0].id });
                        }
                    }
                } catch (error: any) {
                    set({ isLoading: false, error: error.message || 'Failed to fetch workspaces' });
                }
            },

            setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

            createWorkspace: async (name, description) => {
                set({ isLoading: true, error: null });
                try {
                    const newWorkspace = await workspaceService.create({ name, description });
                    set(state => ({
                        workspaces: [...state.workspaces, newWorkspace],
                        activeWorkspaceId: newWorkspace.id, // Switch to new?
                        isLoading: false
                    }));
                } catch (error: any) {
                    set({ isLoading: false, error: error.message || 'Failed to create workspace' });
                }
            },

            getActiveWorkspace: () => {
                const { workspaces, activeWorkspaceId } = get();
                return workspaces.find((w) => w.id === activeWorkspaceId);
            },
        }),
        {
            name: 'workspace-storage',
            partialize: (state) => ({ activeWorkspaceId: state.activeWorkspaceId }), // Only persist active ID ?? Or workspaces too? Maybe just ID to force refresh.
            // Let's persist activeWorkspaceId only to ensure data freshness on reload, fetching on mount.
        }
    )
);
