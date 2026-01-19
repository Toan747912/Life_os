import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { AuthGuard } from '@nestjs/passport';

import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@Controller('workspaces')
@UseGuards(AuthGuard('jwt'))
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.workspacesService.create(createWorkspaceDto, req.user.userId);
  }

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.workspacesService.findAll(req.user.userId);
  }
}
