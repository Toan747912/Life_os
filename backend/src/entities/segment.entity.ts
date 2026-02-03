import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('segments')
export class Segment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Nội dung chính (Text sau khi OCR hoặc Speech-to-text)
    @Column('text', { nullable: true })
    contentText: string;

    // --- Định vị ---
    @Column('float', { nullable: true })
    startTime: number; // Cho Video/Audio (Giây bắt đầu)

    @Column('float', { nullable: true })
    endTime: number;   // Cho Video/Audio (Giây kết thúc)

    @Column('int', { nullable: true })
    pageNumber: number; // Cho PDF

    @Column('jsonb', { nullable: true })
    regionBox: any; // Cho Ảnh (Tọa độ {x, y, w, h})

    // --- AI Metadata ---
    @Column({ nullable: true })
    vectorId: string; // ID tham chiếu sang Vector DB (Qdrant)

    @CreateDateColumn()
    createdAt: Date;

    // Quan hệ: Thuộc về Resource nào
    @ManyToOne(() => require('./resource.entity').Resource, 'segments', { onDelete: 'CASCADE' })
    resource: any;

    // Quan hệ: Có nhiều log training
    @OneToMany(() => require('./training-log.entity').TrainingLog, 'segment')
    trainingLogs: any[];
}