import { Controller, Post, Get, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResourcesService } from './resources.service';

@Controller('resources')
export class ResourcesController {
    constructor(private readonly resourcesService: ResourcesService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file')) // 'file' là tên field trong form-data
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Không có file nào được upload. Vui lòng chọn file.');
        }
        return this.resourcesService.uploadAndCreate(file);
    }

    @Get()
    async getAll() {
        return this.resourcesService.findAll();
    }
}