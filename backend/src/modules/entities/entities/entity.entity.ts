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

@Entity('entities')
export class UnifiedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string; // 'task', 'note', 'project', etc.

  @Column({
    type: 'jsonb',
    comment: 'Stores dynamic properties like title, status, etc.',
  })
  data: Record<string, any>;

  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @ManyToOne(() => UnifiedEntity, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: UnifiedEntity;

  // Lexorank or float order
  @Column({ default: '0' })
  position: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
