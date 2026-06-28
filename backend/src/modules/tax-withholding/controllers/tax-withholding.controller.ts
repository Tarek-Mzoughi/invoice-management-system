import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  NotFoundException,
  Param,
  Body,
  ConflictException,
  Query,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiParam } from '@nestjs/swagger';
import { TaxWithholdingService } from '../services/tax-withholding.service';
import { ResponseTaxWithholdingDto } from '../dtos/tax-withholding.response.dto';
import { CreateTaxWithholdingDto } from '../dtos/tax-withholding.create.dto';
import { UpdateTaxWithholdingDto } from '../dtos/tax-withholding.update.dto';
import { LogInterceptor } from 'src/shared/logger/decorators/logger.interceptor';
import { LogEvent } from 'src/shared/logger/decorators/log-event.decorator';
import { ApiPaginatedResponse } from 'src/shared/database/decorators/api-paginated-resposne.decorator';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { EVENT_TYPE } from 'src/shared/logger/enums/event-type.enum';
import { AdvancedRequest } from 'src/types';
import { RequirePermissions } from 'src/shared/auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';

@ApiTags('tax-withholding')
@Controller({ version: '1', path: '/tax-withholding' })
@UseInterceptors(LogInterceptor)
@RequirePermissions(PERMISSIONS.TAXES.READ)
export class TaxWithholdingController {
  constructor(private readonly taxWithholdingService: TaxWithholdingService) {}

  @Get('/all')
  async findAll(
    @Query() options: IQueryObject,
  ): Promise<ResponseTaxWithholdingDto[]> {
    return this.taxWithholdingService.findAll(options);
  }

  @Get('/list')
  @ApiPaginatedResponse(ResponseTaxWithholdingDto)
  async findAllPaginated(
    @Query() query: IQueryObject,
  ): Promise<PageDto<ResponseTaxWithholdingDto>> {
    return this.taxWithholdingService.findAllPaginated(query);
  }

  @Get('/:id')
  @ApiParam({ name: 'id', type: 'number', required: true })
  async findOneById(
    @Param('id') id: number,
    @Query() query: IQueryObject,
  ): Promise<ResponseTaxWithholdingDto> {
    query.filter
      ? (query.filter += `,id||$eq||${id}`)
      : (query.filter = `id||$eq||${id}`);
    return this.taxWithholdingService.findOneByCondition(query);
  }

  @Post('')
  @RequirePermissions(PERMISSIONS.TAXES.CREATE)
  @LogEvent(EVENT_TYPE.TAX_WITHHOLDING_CREATED)
  async save(
    @Body() createTaxWithholdingDto: CreateTaxWithholdingDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseTaxWithholdingDto> {
    let tax = await this.taxWithholdingService.findOneByCondition({
      filter: `label||$eq||${createTaxWithholdingDto.label}`,
    });
    if (tax) {
      throw new ConflictException(
        `Tax withholding with label "${createTaxWithholdingDto.label}" already exists`,
      );
    }
    tax = await this.taxWithholdingService.save(createTaxWithholdingDto);
    req.logInfo = { id: tax.id };
    return tax;
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/:id')
  @RequirePermissions(PERMISSIONS.TAXES.UPDATE)
  @LogEvent(EVENT_TYPE.TAX_WITHHOLDING_UPDATED)
  async update(
    @Param('id') id: number,
    @Body() updateTaxWithholdingDto: UpdateTaxWithholdingDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseTaxWithholdingDto> {
    const tax = await this.taxWithholdingService.update(
      id,
      updateTaxWithholdingDto,
    );
    if (!tax) {
      throw new NotFoundException(`Tax withholding with ID ${id} not found`);
    }
    req.logInfo = { id };
    return tax;
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Delete('/:id')
  @RequirePermissions(PERMISSIONS.TAXES.DELETE)
  @LogEvent(EVENT_TYPE.TAX_WITHHOLDING_DELETED)
  async delete(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseTaxWithholdingDto> {
    req.logInfo = { id };
    return this.taxWithholdingService.softDelete(id);
  }
}
