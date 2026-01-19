import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { LearningSession } from './learning-session.entity';

@Entity('mistake_logs')
export class MistakeLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'session_id' })
    sessionId: string;

    @ManyToOne(() => LearningSession, (session) => session.mistakes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'session_id' })
    session: LearningSession;

    @Column({ name: 'target_word' })
    targetWord: string;

    @Column({ name: 'user_input', type: 'text' })
    userInput: string;

    @Column({ name: 'error_type', length: 50 })
    errorType: string; // 'TYPO', 'WRONG_ANSWER'
}
