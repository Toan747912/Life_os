import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';

export enum ResourceStatus {
    UPLOADING = 'uploading',
    PROCESSING = 'processing',
    READY = 'ready',
    FAILED = 'failed',
}

export enum FileType {
    VIDEO = 'video',
    AUDIO = 'audio',
    IMAGE = 'image',
    PDF = 'pdf',
}

@Entity('resources')
export class Resource {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    title: string;

    @Column({
        type: 'enum',
        enum: FileType,
        default: FileType.IMAGE
    })
    fileType: FileType;

    @Column()
    storagePath: string; // Đường dẫn file trong MinIO (VD: /bucket/file.jpg)

    @Column({
        type: 'enum',
        enum: ResourceStatus,
        default: ResourceStatus.UPLOADING
    })
    status: ResourceStatus;

    @CreateDateColumn()
    createdAt: Date;

    // Quan hệ: Một Resource có nhiều Segment
    @OneToMany(() => require('./segment.entity').Segment, 'resource')
    segments: any[];
}