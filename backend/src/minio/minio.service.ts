import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MinioService implements OnModuleInit {
    private minioClient: Minio.Client;
    private bucketName: string;

    constructor(private readonly configService: ConfigService) {
        this.bucketName = this.configService.get('MINIO_BUCKET_NAME') || 'life-os-data';

        // Khởi tạo Client
        this.minioClient = new Minio.Client({
            endPoint: this.configService.get('MINIO_ENDPOINT') || 'localhost',
            port: parseInt(this.configService.get('MINIO_PORT') || '9000'),
            useSSL: false,
            accessKey: this.configService.get('MINIO_ACCESS_KEY') || 'minioadmin',
            secretKey: this.configService.get('MINIO_SECRET_KEY') || 'minioadmin',
        });
    }

    // Tự động chạy khi khởi động app: Kiểm tra xem Bucket có tồn tại chưa
    async onModuleInit() {
        try {
            const exists = await this.minioClient.bucketExists(this.bucketName);
            if (!exists) {
                await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
                console.log(`Bucket '${this.bucketName}' created successfully.`);
            } else {
                console.log(`MinIO connected. Bucket '${this.bucketName}' already exists.`);
            }
        } catch (error) {
            console.warn('⚠️  MinIO is not available. File upload will not work until MinIO is started.');
            console.warn('   To start MinIO, run: docker compose up -d minio');
        }
    }

    // Hàm upload file
    async uploadFile(file: Express.Multer.File) {
        const fileName = `${Date.now()}-${file.originalname}`; // Đổi tên file để tránh trùng

        await this.minioClient.putObject(
            this.bucketName,
            fileName,
            file.buffer,
            file.size,
        );

        return {
            url: `http://${this.configService.get('MINIO_ENDPOINT')}:${this.configService.get('MINIO_PORT')}/${this.bucketName}/${fileName}`,
            fileName: fileName,
        };
    }
}