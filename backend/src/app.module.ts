import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// Import các Entity
import { Resource } from './entities/resource.entity';
import { Segment } from './entities/segment.entity';
import { TrainingLog } from './entities/training-log.entity';
import { ResourcesModule } from './resources/resources.module';
import { MinioModule } from './minio/minio.module';

@Module({
  imports: [
    // 1. Load file .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // 2. Kết nối Database
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'admin',
      password: process.env.DB_PASSWORD || 'adminpassword',
      database: process.env.DB_NAME || 'life_os_db',
      autoLoadEntities: true, // Tự động load entity (khuyên dùng cho dev)
      entities: [Resource, Segment, TrainingLog], // Đăng ký các Entity
      synchronize: true, // Auto tạo bảng (chỉ dùng cho Dev, Prod nên tắt)
    }),
    MinioModule,
    ResourcesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }