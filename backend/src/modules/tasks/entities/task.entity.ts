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
import { Subject } from './subject.entity';
// Removed duplicate import

export enum TaskPriority {
  URGENT = 'URGENT',
  HIGH = 'HIGH',
  NORMAL = 'NORMAL',
  LOW = 'LOW',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.NORMAL,
  })
  priority: TaskPriority;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({
    name: 'due_date',
    type: 'timestamp with time zone',
    nullable: true,
  })
  dueDate: Date;

  @Column({ name: 'is_recurring', default: false })
  isRecurring: boolean;

  @Column({ name: 'recurrence_rule', type: 'text', nullable: true })
  recurrenceRule: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Subject, (subject) => subject.tasks, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ name: 'subject_id', nullable: true })
  subjectId: string;

  // Sub-tasks parent
  @ManyToOne(() => Task, (task) => task.subTasks, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Task;

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @OneToMany(() => Task, (task) => task.parent)
  subTasks: Task[];

  // Recurring instances origin
  @ManyToOne(() => Task, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'original_task_id' })
  originalTask: Task;

  @Column({ name: 'original_task_id', nullable: true })
  originalTaskId: string;

  // @OneToMany(() => FocusSession, (session) => session.task)
  // focusSessions: FocusSession[];
}
