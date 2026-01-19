import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import {
  CreateFlashcardDto,
  ReviewFlashcardDto,
} from './dto/create-flashcard.dto';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('flashcards')
@UseGuards(AuthGuard('jwt'))
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Post()
  create(
    @Request() req: AuthenticatedRequest,
    @Body() createFlashcardDto: CreateFlashcardDto,
  ) {
    return this.flashcardsService.create(req.user.userId, createFlashcardDto);
  }

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.flashcardsService.findAll(req.user.userId);
  }

  @Get('due')
  findDue(@Request() req: AuthenticatedRequest) {
    return this.flashcardsService.findDue(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.flashcardsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateFlashcardDto: any,
  ) {
    return this.flashcardsService.update(
      id,
      req.user.userId,
      updateFlashcardDto,
    );
  }

  @Delete(':id')
  remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.flashcardsService.remove(id, req.user.userId);
  }

  @Post(':id/review')
  review(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() reviewDto: ReviewFlashcardDto,
  ) {
    return this.flashcardsService.review(id, req.user.userId, reviewDto);
  }
}
