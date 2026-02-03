import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';

export enum CorrectionType {
    OCR_FIX = 'ocr_fix',           // Sửa lỗi nhận diện chữ
    SPEECH_FIX = 'speech_fix',     // Sửa lỗi giọng nói
    CLASSIFICATION = 'classification', // Sửa nhãn phân loại (Code vs Text)
}

@Entity('training_logs')
export class TrainingLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    originalAiOutput: string; // Kết quả ban đầu của AI (cái bị sai)

    @Column('text')
    correctedOutput: string;  // Kết quả chuẩn do bạn sửa (Ground Truth)

    @Column({
        type: 'enum',
        enum: CorrectionType
    })
    correctionType: CorrectionType;

    @Column({ default: false })
    isTrained: boolean; // Đánh dấu đã dùng dữ liệu này để train lại model chưa

    @CreateDateColumn()
    createdAt: Date;

    // Quan hệ: Thuộc về Segment nào
    @ManyToOne(() => require('./segment.entity').Segment, 'trainingLogs')
    segment: any;
}