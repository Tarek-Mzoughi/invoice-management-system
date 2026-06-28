import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiParam } from '@nestjs/swagger';
import { ActivityService } from '../services/activity.service';
import { CreateActivityDto } from '../dtos/activity.create.dto';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { UpdateActivityDto } from '../dtos/activity.update.dto';
import { ResponseActivityDto } from '../dtos/activity.response.dto';
import { LogInterceptor } from 'src/shared/logger/decorators/logger.interceptor';
import { LogEvent } from 'src/shared/logger/decorators/log-event.decorator';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { ApiPaginatedResponse } from 'src/shared/database/decorators/api-paginated-resposne.decorator';
import { toDto, toDtoArray } from 'src/shared/database/utils/dtos';
import { EVENT_TYPE } from 'src/shared/logger/enums/event-type.enum';
import { AdvancedRequest } from 'src/types';
import { RequirePermissions } from 'src/shared/auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';

@ApiTags('activity')
@Controller({ version: '1', path: '/activity' })
@UseInterceptors(LogInterceptor)
@RequirePermissions(
  PERMISSIONS.DOCUMENT_SETTINGS.READ,
  "Vous n'avez pas l'autorisation de consulter les activités.",
)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('/all')
  async findAll(
    @Query() options: IQueryObject,
  ): Promise<ResponseActivityDto[]> {
    return toDtoArray(
      ResponseActivityDto,
      await this.activityService.findAll(options),
    );
  }

  @Get('/list')
  @ApiPaginatedResponse(ResponseActivityDto)
  async findAllPaginated(
    @Query() query: IQueryObject,
  ): Promise<PageDto<ResponseActivityDto>> {
    const paginated = await this.activityService.findAllPaginated(query);
    return {
      meta: paginated.meta,
      data: toDtoArray(ResponseActivityDto, paginated.data),
    };
  }

  @Get('/:id')
  @ApiParam({ name: 'id', type: 'number', required: true })
  async findOneById(@Param('id') id: number): Promise<ResponseActivityDto> {
    return toDto(
      ResponseActivityDto,
      await this.activityService.findOneById(id),
    );
  }

  @Post('')
  @RequirePermissions(PERMISSIONS.DOCUMENT_SETTINGS.CREATE)
  @LogEvent(EVENT_TYPE.ACTIVITY_CREATED)
  async save(
    @Body() createActivityDto: CreateActivityDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseActivityDto> {
    const activty = await this.activityService.save(createActivityDto);
    req.logInfo = { id: activty.id };
    return toDto(ResponseActivityDto, activty);
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/:id')
  @RequirePermissions(PERMISSIONS.DOCUMENT_SETTINGS.UPDATE)
  @LogEvent(EVENT_TYPE.ACTIVITY_UPDATED)
  async update(
    @Param('id') id: number,
    @Body() updateActivityDto: UpdateActivityDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseActivityDto> {
    req.logInfo = { id };
    return toDto(
      ResponseActivityDto,
      await this.activityService.update(id, updateActivityDto),
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Delete('/:id')
  @RequirePermissions(PERMISSIONS.DOCUMENT_SETTINGS.DELETE)
  @LogEvent(EVENT_TYPE.ACTIVITY_DELETED)
  async delete(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseActivityDto> {
    req.logInfo = { id };
    return toDto(
      ResponseActivityDto,
      await this.activityService.softDelete(id),
    );
  }
}
