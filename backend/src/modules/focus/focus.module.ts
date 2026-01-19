import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FocusService } from './focus.service';
import { FocusController } from './focus.controller';
import { FocusSession } from './entities/focus-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FocusSession])],
  controllers: [FocusController],
  providers: [FocusService],
  exports: [FocusService],
})
export class FocusModule {}
