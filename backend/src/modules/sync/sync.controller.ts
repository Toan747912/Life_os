import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SyncService } from './sync.service';
import { PushChangesDto } from './dto/push-changes.dto';
import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('sync')
@UseGuards(AuthGuard('jwt'))
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  push(@Request() req: AuthenticatedRequest, @Body() pushDto: PushChangesDto) {
    return this.syncService.push(req.user.userId, pushDto);
  }

  @Get('pull')
  pull(@Request() req: AuthenticatedRequest, @Query('since') since: string) {
    // Default to epoch if no since param
    const sinceDate = since || new Date(0).toISOString();
    return this.syncService.pull(req.user.userId, sinceDate);
  }
}
