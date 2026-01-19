import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum FocusSessionStatus {
  COMPLETED = 'completed',
  INTERRUPTED = 'interrupted',
}

@Entity('focus_sessions')
export class FocusSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'start_time', type: 'timestamp' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp' })
  endTime: Date;

  @Column({ type: 'int', comment: 'Duration in seconds' })
  duration: number;

  @Column({
    type: 'enum',
    enum: FocusSessionStatus,
    default: FocusSessionStatus.COMPLETED,
  })
  status: FocusSessionStatus;

  @Column({ name: 'linked_entity_id', nullable: true })
  linkedEntityId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
