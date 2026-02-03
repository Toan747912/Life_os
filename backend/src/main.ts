import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cho phép mọi nguồn gọi API (Trong thực tế nên giới hạn domain cụ thể)
  app.enableCors();

  // Đọc port từ .env hoặc mặc định 3000
  const port = process.env.PORT || 3000;

  await app.listen(port);
  console.log(`🚀 Backend đang chạy trên: http://localhost:${port}`);
}
bootstrap();
