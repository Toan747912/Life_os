import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Task } from './task.entity';
import { Note } from '../../notes/entities/note.entity';

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', length: 100 })
  name: string;

  @Column({ name: 'color_hex', length: 7, default: '#FFFFFF' })
  colorHex: string;

  @Column({ name: 'icon_key', nullable: true, length: 50 })
  iconKey: string;

  @Column({ name: 'target_hours_per_week', default: 0 })
  targetHoursPerWeek: number;

  @Column({ name: 'is_archived', default: false })
  isArchived: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.subjects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @OneToMany(() => Task, (task) => task.subject)
  tasks: Task[];

  @OneToMany(() => Note, (note) => note.subject)
  notes: Note[];
}
