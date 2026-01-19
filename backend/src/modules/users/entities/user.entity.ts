import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';
import { Subject } from '../../tasks/entities/subject.entity';
import { FocusSession } from '../../focus/entities/focus-session.entity';
import { Note } from '../../notes/entities/note.entity';
import { Flashcard } from '../../flashcards/entities/flashcard.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'full_name', nullable: true })
  fullName: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @OneToMany(() => Task, (task) => task.user)
  tasks: Task[];

  @OneToMany(() => Subject, (subject) => subject.user)
  subjects: Subject[];

  @OneToMany(() => FocusSession, (session) => session.user)
  focusSessions: FocusSession[];

  @OneToMany(() => Note, (note) => note.user)
  notes: Note[];

  @OneToMany(() => Flashcard, (card) => card.user)
  flashcards: Flashcard[];
}
