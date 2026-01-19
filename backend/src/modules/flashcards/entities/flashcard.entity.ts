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
import { Note } from '../../notes/entities/note.entity';
import { ReviewLog } from './review-log.entity';

export enum CardType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  CODE = 'CODE',
}

@Entity('flashcards')
export class Flashcard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'front_content', type: 'text' })
  frontContent: string;

  @Column({ name: 'back_content', type: 'text' })
  backContent: string;

  @Column({
    type: 'enum',
    enum: CardType,
    default: CardType.TEXT,
  })
  cardType: CardType;

  // SM-2 State
  @Column({ default: 0 })
  interval: number;

  @Column({ default: 0 })
  repetition: number;

  @Column({ name: 'ease_factor', type: 'real', default: 2.5 })
  easeFactor: number;

  @Column({
    name: 'next_review_date',
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  nextReviewDate: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.flashcards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Note, (note) => note.flashcards, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'note_id' })
  note: Note;

  @Column({ name: 'note_id', nullable: true })
  noteId: string;

  @OneToMany(() => ReviewLog, (log) => log.flashcard)
  reviewLogs: ReviewLog[];
}
