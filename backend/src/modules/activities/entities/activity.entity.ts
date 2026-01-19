import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Workspace } from '../../workspaces/entities/workspace.entity';

export enum ActivityStatus {
    TODO = 'TODO',
    DONE = 'DONE',
    ARCHIVED = 'ARCHIVED',
}

@Entity('activities')
export class Activity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'workspace_id', nullable: true })
    workspaceId: string;

    @ManyToOne(() => Workspace, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'workspace_id' })
    workspace: Workspace;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({
        type: 'enum',
        enum: ActivityStatus,
        default: ActivityStatus.TODO,
    })
    status: ActivityStatus;

    @Column({ name: 'start_at', type: 'timestamp', nullable: true })
    startAt: Date;

    @Column({ name: 'due_at', type: 'timestamp', nullable: true })
    dueAt: Date;

    @Column({ name: 'recurrence_rule', type: 'text', nullable: true })
    recurrenceRule: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @Column({ name: 'last_updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    lastUpdatedAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
