import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Flashcard } from './flashcard.entity';

@Entity('review_logs')
export class ReviewLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  rating: number; // 0-5

  @CreateDateColumn({ name: 'reviewed_at', type: 'timestamp with time zone' })
  reviewedAt: Date;

  @ManyToOne(() => Flashcard, (card) => card.reviewLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'card_id' })
  flashcard: Flashcard;

  @Column({ name: 'card_id' })
  cardId: string;
}
