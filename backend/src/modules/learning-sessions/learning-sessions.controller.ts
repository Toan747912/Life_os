import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LearningSessionsService } from './learning-sessions.service';

@Controller('learning-sessions')
@UseGuards(AuthGuard('jwt'))
export class LearningSessionsController {
    constructor(private readonly sessionsService: LearningSessionsService) { }

    @Post()
    create(@Req() req: any, @Body() createSessionDto: any) {
        // Inject userId from the authenticated user
        return this.sessionsService.create({
            ...createSessionDto,
            userId: req.user.userId, // key depends on JWT strategy, usually userId or id
        });
    }

    @Get()
    findAll(@Req() req: any) {
        return this.sessionsService.findAll(req.user.userId);
    }
}
