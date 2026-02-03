import { Global, Module } from '@nestjs/common';
import { MinioService } from './minio.service';

@Global() // Đánh dấu Global để dùng được ở mọi nơi mà không cần import lại
@Module({
  providers: [MinioService],
  exports: [MinioService],
})
export class MinioModule {}