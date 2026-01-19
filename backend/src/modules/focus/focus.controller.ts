import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FocusService } from './focus.service';
import { CreateFocusSessionDto } from './dto/create-focus-session.dto';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('focus')
@UseGuards(AuthGuard('jwt'))
export class FocusController {
  constructor(private readonly focusService: FocusService) {}

  @Post('sessions')
  create(
    @Request() req: AuthenticatedRequest,
    @Body() createFocusSessionDto: CreateFocusSessionDto,
  ) {
    return this.focusService.create(req.user.userId, createFocusSessionDto);
  }

  @Get('sessions')
  findAll(@Request() req: AuthenticatedRequest) {
    return this.focusService.findAll(req.user.userId);
  }

  @Get('stats')
  getStats(@Request() req: AuthenticatedRequest) {
    return this.focusService.getStats(req.user.userId);
  }
}
