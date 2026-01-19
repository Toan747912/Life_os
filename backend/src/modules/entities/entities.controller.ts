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
import { EntitiesService } from './entities.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class EntitiesController {
  constructor(private readonly entitiesService: EntitiesService) {}

  @Post('workspaces/:workspaceId/entities')
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() createEntityDto: CreateEntityDto,
  ) {
    // TODO: Validate user owns workspace
    return this.entitiesService.create(workspaceId, createEntityDto);
  }

  @Get('workspaces/:workspaceId/entities')
  findAll(@Param('workspaceId') workspaceId: string) {
    // TODO: Validate user owns workspace
    return this.entitiesService.findAll(workspaceId);
  }

  @Get('entities/:id')
  findOne(@Param('id') id: string) {
    return this.entitiesService.findOne(id);
  }

  @Patch('entities/:id')
  update(
    @Param('id') id: string,
    @Body() updateEntityDto: Partial<CreateEntityDto>,
  ) {
    return this.entitiesService.update(id, updateEntityDto);
  }

  @Delete('entities/:id')
  remove(@Param('id') id: string) {
    return this.entitiesService.remove(id);
  }
}
