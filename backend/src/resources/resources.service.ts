import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resource, ResourceStatus, FileType } from '../entities/resource.entity';
import { MinioService } from '../minio/minio.service';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private resourceRepo: Repository<Resource>,
    private minioService: MinioService,
  ) {}

  async uploadAndCreate(file: Express.Multer.File) {
    // 1. Upload lên MinIO
    const uploadResult = await this.minioService.uploadFile(file);

    // 2. Xác định loại file (đơn giản hóa)
    let type = FileType.IMAGE;
    if (file.mimetype.includes('pdf')) type = FileType.PDF;
    if (file.mimetype.includes('video')) type = FileType.VIDEO;
    if (file.mimetype.includes('audio')) type = FileType.AUDIO;

    // 3. Lưu metadata vào Database PostgreSQL
    const newResource = this.resourceRepo.create({
      title: file.originalname,
      fileType: type,
      storagePath: uploadResult.fileName, // Lưu tên file trong bucket
      status: ResourceStatus.UPLOADING, // Tạm thời để status này
    });

    return await this.resourceRepo.save(newResource);
  }

  async findAll() {
    return await this.resourceRepo.find({ order: { createdAt: 'DESC' } });
  }
}