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
import { Subject } from '../../tasks/entities/subject.entity';
import { Flashcard } from '../../flashcards/entities/flashcard.entity';
import { NoteLink } from './note-link.entity';

@Entity('notes')
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ name: 'is_archived', default: false })
  isArchived: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.notes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Subject, (subject) => subject.notes, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ name: 'subject_id', nullable: true })
  subjectId: string;

  @OneToMany(() => Flashcard, (card) => card.note)
  flashcards: Flashcard[];

  // Bidirectional Links using explicit Join Entity
  @OneToMany(() => NoteLink, (link) => link.sourceNote)
  outgoingLinks: NoteLink[];

  @OneToMany(() => NoteLink, (link) => link.targetNote)
  incomingLinks: NoteLink[];
}
