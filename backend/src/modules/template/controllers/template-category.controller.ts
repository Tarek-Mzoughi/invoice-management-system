import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiParam } from '@nestjs/swagger';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { LogInterceptor } from 'src/shared/logger/decorators/logger.interceptor';
import { LogEvent } from 'src/shared/logger/decorators/log-event.decorator';
import { TemplateCategoryService } from '../services/template-category.service';
import { ResponseTemplateCategoryDto } from '../dtos/template-category.response.dto';
import { CreateTemplateCategoryDto } from '../dtos/template-category.create.dto';
import { UpdateTemplateCategoryDto } from '../dtos/template-category.update.dto';
import { ApiPaginatedResponse } from 'src/shared/database/decorators/api-paginated-resposne.decorator';
import { EVENT_TYPE } from 'src/shared/logger/enums/event-type.enum';
import { AdvancedRequest } from 'src/types';

@ApiTags('template-category')
@Controller({ version: '1', path: '/template-category' })
@UseInterceptors(LogInterceptor)
export class TemplateCategoryController {
  constructor(
    private readonly templateCategoryService: TemplateCategoryService,
  ) {}

  @Get('/all')
  async findAll(
    @Query() options: IQueryObject,
  ): Promise<ResponseTemplateCategoryDto[]> {
    return this.templateCategoryService.findAll(options);
  }

  @Get('/list')
  @ApiPaginatedResponse(ResponseTemplateCategoryDto)
  async findAllPaginated(
    @Query() query: IQueryObject,
  ): Promise<PageDto<ResponseTemplateCategoryDto>> {
    return await this.templateCategoryService.findAllPaginated(query);
  }

  @Get('/:id')
  @ApiParam({ name: 'id', type: 'number', required: true })
  async findOneById(
    @Param('id') id: number,
    @Query() query: IQueryObject,
  ): Promise<ResponseTemplateCategoryDto> {
    query.filter
      ? (query.filter += `,id||$eq||${id}`)
      : (query.filter = `id||$eq||${id}`);
    return await this.templateCategoryService.findOneByCondition(query);
  }

  @Post('')
  @LogEvent(EVENT_TYPE.TEMPLATE_CATEGORY_CREATED)
  async save(
    @Body() createTemplateCategoryDto: CreateTemplateCategoryDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseTemplateCategoryDto> {
    const category = await this.templateCategoryService.save(
      createTemplateCategoryDto,
    );
    req.logInfo = { id: category.id };
    return category;
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/:id')
  @LogEvent(EVENT_TYPE.TEMPLATE_CATEGORY_UPDATED)
  async update(
    @Param('id') id: number,
    @Body() updateTemplateCategoryDto: UpdateTemplateCategoryDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseTemplateCategoryDto> {
    req.logInfo = { id };
    return this.templateCategoryService.update(id, updateTemplateCategoryDto);
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Delete('/:id')
  @LogEvent(EVENT_TYPE.TEMPLATE_CATEGORY_DELETED)
  async delete(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseTemplateCategoryDto> {
    req.logInfo = { id };
    return this.templateCategoryService.softDelete(id);
  }
}
