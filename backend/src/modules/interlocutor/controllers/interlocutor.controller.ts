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
import { InterlocutorService } from '../services/interlocutor.service';
import { ResponseInterlocutorDto } from '../dtos/interlocutor.response.dto';
import { CreateInterlocutorDto } from '../dtos/interlocutor.create.dto';
import { UpdateInterlocutorDto } from '../dtos/interlocutor.update.dto';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { LogInterceptor } from 'src/shared/logger/decorators/logger.interceptor';
import { LogEvent } from 'src/shared/logger/decorators/log-event.decorator';
import { ApiPaginatedResponse } from 'src/shared/database/decorators/api-paginated-resposne.decorator';
import { EVENT_TYPE } from 'src/shared/logger/enums/event-type.enum';
import { AdvancedRequest } from 'src/types';

@ApiTags('interlocutor')
@Controller({ version: '1', path: '/interlocutor' })
@UseInterceptors(LogInterceptor)
export class InterlocutorController {
  constructor(private readonly interlocutorService: InterlocutorService) {}

  @Get('/all')
  async findAll(
    @Query() options: IQueryObject,
  ): Promise<ResponseInterlocutorDto[]> {
    return await this.interlocutorService.findAll(options);
  }

  @Get('/list')
  @ApiPaginatedResponse(ResponseInterlocutorDto)
  async findAllPaginated(
    @Query() query: IQueryObject,
  ): Promise<PageDto<ResponseInterlocutorDto>> {
    return await this.interlocutorService.findAllPaginated(query);
  }

  @Get('/:id')
  @ApiParam({ name: 'id', type: 'number', required: true })
  async findOneById(
    @Param('id') id: number,
    @Query() query: IQueryObject,
  ): Promise<ResponseInterlocutorDto> {
    query.filter
      ? (query.filter += `,id||$eq||${id}`)
      : (query.filter = `id||$eq||${id}`);
    return await this.interlocutorService.findOneByCondition(query);
  }

  @Post('')
  @LogEvent(EVENT_TYPE.INTERLOCUTOR_CREATED)
  async save(
    @Body() createInterlocutorDto: CreateInterlocutorDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseInterlocutorDto> {
    const interlocutor = await this.interlocutorService.save(
      createInterlocutorDto,
    );
    req.logInfo = { id: interlocutor.id };
    return interlocutor;
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Post('/promote/:id/:firmId')
  @LogEvent(EVENT_TYPE.INTERLOCUTOR_PROMOTED)
  async promote(
    @Param('id') id: number,
    @Param('firmId') firmId: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseInterlocutorDto> {
    const demoted = await this.interlocutorService.demote(firmId);
    const promoted = await this.interlocutorService.promote(id, firmId);
    req.logInfo = {
      demoted: demoted.id,
      promoted: promoted.id,
      firmId: firmId,
    };
    return await this.interlocutorService.findOneById(id);
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/:id')
  @LogEvent(EVENT_TYPE.INTERLOCUTOR_UPDATED)
  async update(
    @Param('id') id: number,
    @Body() updateInterlocutorDto: UpdateInterlocutorDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseInterlocutorDto> {
    req.logInfo = { id };
    return await this.interlocutorService.update(id, updateInterlocutorDto);
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Delete('/:id')
  @LogEvent(EVENT_TYPE.INTERLOCUTOR_DELETED)
  async delete(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseInterlocutorDto> {
    req.logInfo = { id };
    return await this.interlocutorService.softDelete(id);
  }
}
