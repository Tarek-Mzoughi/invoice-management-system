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
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { DefaultConditionService } from '../services/default-condition.service';
import { ResponseDefaultConditionDto } from '../dtos/default-condition.response.dto';
import { CreateDefaultConditionDto } from '../dtos/default-condition.create.dto';
import { UpdateDefaultConditionDto } from '../dtos/default-condition.update.dto';
import { LogInterceptor } from 'src/shared/logger/decorators/logger.interceptor';
import { LogEvent } from 'src/shared/logger/decorators/log-event.decorator';
import { ApiPaginatedResponse } from 'src/shared/database/decorators/api-paginated-resposne.decorator';
import { EVENT_TYPE } from 'src/shared/logger/enums/event-type.enum';
import { AdvancedRequest } from 'src/types';
import { RequirePermissions } from 'src/shared/auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';

@ApiTags('default-condition')
@Controller({ version: '1', path: '/default-condition' })
@UseInterceptors(LogInterceptor)
@RequirePermissions(PERMISSIONS.DOCUMENT_SETTINGS.READ)
export class DefaultConditionController {
  constructor(
    private readonly defaultConditionService: DefaultConditionService,
  ) {}

  @Get('/all')
  async findAll(
    @Query() options: IQueryObject,
  ): Promise<ResponseDefaultConditionDto[]> {
    return await this.defaultConditionService.findAll(options);
  }

  @Get('/list')
  @ApiPaginatedResponse(ResponseDefaultConditionDto)
  async findAllPaginated(
    @Query() query: IQueryObject,
  ): Promise<PageDto<ResponseDefaultConditionDto>> {
    return await this.defaultConditionService.findAllPaginated(query);
  }

  @Get('/:id')
  @ApiParam({ name: 'id', type: 'number', required: true })
  async findOneById(
    @Param('id') id: number,
    @Query() query: IQueryObject,
  ): Promise<ResponseDefaultConditionDto> {
    query.filter
      ? (query.filter += `,id||$eq||${id}`)
      : (query.filter = `id||$eq||${id}`);
    return await this.defaultConditionService.findOneByCondition(query);
  }

  @Post('')
  @RequirePermissions(PERMISSIONS.DOCUMENT_SETTINGS.CREATE)
  @LogEvent(EVENT_TYPE.DEFAULT_CONDITION_CREATED)
  async save(
    @Body() createDefaultConditionDto: CreateDefaultConditionDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseDefaultConditionDto> {
    const condition = await this.defaultConditionService.save(
      createDefaultConditionDto,
    );
    req.logInfo = { id: condition.id };
    return condition;
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/batch-update')
  @RequirePermissions(PERMISSIONS.DOCUMENT_SETTINGS.UPDATE)
  @LogEvent(EVENT_TYPE.DEFAULT_CONDITION_MASS_UPDATED)
  async batchUpdate(
    @Body()
    updateDefaultConditionDtos: UpdateDefaultConditionDto[],
    @Request() req: AdvancedRequest,
  ): Promise<ResponseDefaultConditionDto[]> {
    req.logInfo = { ids: updateDefaultConditionDtos.map((entry) => entry.id) };
    return await this.defaultConditionService.updateMany(
      updateDefaultConditionDtos,
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/:id')
  @RequirePermissions(PERMISSIONS.DOCUMENT_SETTINGS.UPDATE)
  @LogEvent(EVENT_TYPE.DEFAULT_CONDITION_UPDATED)
  async update(
    @Param('id') id: number,
    @Body() updateDefaultConditionDto: UpdateDefaultConditionDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseDefaultConditionDto> {
    req.logInfo = { id };
    return await this.defaultConditionService.update(
      id,
      updateDefaultConditionDto,
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Delete('/:id')
  @RequirePermissions(PERMISSIONS.DOCUMENT_SETTINGS.DELETE)
  @LogEvent(EVENT_TYPE.DEFAULT_CONDITION_DELETED)
  async delete(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseDefaultConditionDto> {
    req.logInfo = { id };
    return await this.defaultConditionService.softDelete(id);
  }
}
