import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { MistakeLog } from './mistake-log.entity';

@Entity('study_sessions')
export class LearningSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: string;

    @Column({ name: 'activity_id', nullable: true })
    activityId: string; // Optional link to an activity/subject

    @Column({ length: 20 })
    mode: string; // 'QUIZ', 'FILL_BLANK', 'SCRAMBLE'

    @Column()
    score: number;

    @Column({ name: 'duration_seconds' })
    durationSeconds: number;

    @CreateDateColumn({ name: 'started_at' })
    startedAt: Date;

    @Column({ name: 'completed_at', nullable: true })
    completedAt: Date;

    @OneToMany(() => MistakeLog, (log) => log.session, { cascade: true })
    mistakes: MistakeLog[];
}
