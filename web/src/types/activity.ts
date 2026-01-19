export interface Activity {
    id: string;
    serverId?: string;
    title: string;
    status: 'TODO' | 'DONE' | 'ARCHIVED';
    startAt?: string;
    dueAt?: string;
    recurrenceRule?: string;
    metadata?: any;
    lastUpdatedAt?: string;
    createdAt?: string;
}

export type CreateActivityDto = Pick<Activity, 'title' | 'dueAt' | 'recurrenceRule' | 'metadata'>;
export type UpdateActivityDto = Partial<CreateActivityDto> & { status?: Activity['status'] };
