import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  NotFoundException,
  Param,
  Body,
  Query,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiParam } from '@nestjs/swagger';
import { TaxService } from '../services/tax.service';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { CreateTaxDto } from '../dtos/tax.create.dto';
import { UpdateTaxDto } from '../dtos/tax.update.dto';
import { ResponseTaxDto } from '../dtos/tax.response.dto';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { LogInterceptor } from 'src/shared/logger/decorators/logger.interceptor';
import { LogEvent } from 'src/shared/logger/decorators/log-event.decorator';
import { ApiPaginatedResponse } from 'src/shared/database/decorators/api-paginated-resposne.decorator';
import { EVENT_TYPE } from 'src/shared/logger/enums/event-type.enum';
import { AdvancedRequest } from 'src/types';
import { RequirePermissions } from 'src/shared/auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';

@ApiTags('tax')
@Controller({ version: '1', path: '/tax' })
@UseInterceptors(LogInterceptor)
@RequirePermissions(
  PERMISSIONS.TAXES.READ,
  "Vous n'avez pas l'autorisation de consulter les taxes.",
)
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Get('/all')
  async findAll(
    @Query() options: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseTaxDto[]> {
    return await this.taxService.findAll(options, req.user.sub, {
      activeOnly: `${(options as any).activeOnly}` === 'true',
    });
  }

  @Get('/templates')
  async findTemplates(
    @Query() options: IQueryObject,
  ): Promise<ResponseTaxDto[]> {
    return await this.taxService.findTemplates(options);
  }

  @Get('/list')
  @ApiPaginatedResponse(ResponseTaxDto)
  async findAllPaginated(
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<PageDto<ResponseTaxDto>> {
    return await this.taxService.findAllPaginated(query, req.user.sub, {
      activeOnly: `${(query as any).activeOnly}` === 'true',
    });
  }

  @Get('/:id')
  @ApiParam({ name: 'id', type: 'number', required: true })
  async findOneById(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseTaxDto> {
    return await this.taxService.findOneVisibleById(Number(id), req.user.sub);
  }

  @Post('')
  @RequirePermissions(PERMISSIONS.TAXES.CREATE)
  @LogEvent(EVENT_TYPE.TAX_CREATED)
  async save(
    @Body() createTaxDto: CreateTaxDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseTaxDto> {
    const tax = await this.taxService.save(createTaxDto, req.user.sub);
    req.logInfo = { id: tax.id };
    return tax;
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/:id')
  @RequirePermissions(PERMISSIONS.TAXES.UPDATE)
  @LogEvent(EVENT_TYPE.TAX_UPDATED)
  async update(
    @Param('id') id: number,
    @Body() updateTaxDto: UpdateTaxDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseTaxDto> {
    const tax = await this.taxService.update(
      Number(id),
      updateTaxDto,
      req.user.sub,
    );
    if (!tax) {
      throw new NotFoundException(`Tax with ID ${id} not found`);
    }
    req.logInfo = { id };
    return tax;
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Delete('/:id')
  @RequirePermissions(PERMISSIONS.TAXES.DELETE)
  @LogEvent(EVENT_TYPE.TAX_DELETED)
  async delete(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseTaxDto> {
    const tax = await this.taxService.softDelete(Number(id), req.user.sub);
    if (!tax) {
      throw new NotFoundException(`Tax with ID ${id} not found`);
    }
    req.logInfo = { id };
    return tax;
  }
}
