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
import { PaymentConditionService } from '../services/payment-condition.service';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { ResponsePaymentConditionDto } from '../dtos/payment-condition.response.dto';
import { CreatePaymentConditionDto } from '../dtos/payment-condition.create.dto';
import { UpdatePaymentConditionDto } from '../dtos/payment-condition.update.dto';
import { LogInterceptor } from 'src/shared/logger/decorators/logger.interceptor';
import { LogEvent } from 'src/shared/logger/decorators/log-event.decorator';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { ApiPaginatedResponse } from 'src/shared/database/decorators/api-paginated-resposne.decorator';
import { AdvancedRequest } from 'src/types';
import { EVENT_TYPE } from 'src/shared/logger/enums/event-type.enum';
import { RequirePermissions } from 'src/shared/auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';

@ApiTags('payment-condition')
@Controller({ version: '1', path: '/payment-condition' })
@UseInterceptors(LogInterceptor)
@RequirePermissions(PERMISSIONS.DOCUMENT_SETTINGS.READ)
export class PaymentConditionController {
  constructor(
    private readonly paymentConditionService: PaymentConditionService,
  ) {}

  @Get('/all')
  async findAll(
    @Query() options: IQueryObject,
  ): Promise<ResponsePaymentConditionDto[]> {
    return this.paymentConditionService.findAll(options);
  }

  @Get('/list')
  @ApiPaginatedResponse(ResponsePaymentConditionDto)
  async findAllPaginated(
    @Query() query: IQueryObject,
  ): Promise<PageDto<ResponsePaymentConditionDto>> {
    return this.paymentConditionService.findAllPaginated(query);
  }

  @Get('/:id')
  @ApiParam({ name: 'id', type: 'number', required: true })
  async findOneById(
    @Param('id') id: number,
    @Query() query: IQueryObject,
  ): Promise<ResponsePaymentConditionDto> {
    query.filter
      ? (query.filter += `,id||$eq||${id}`)
      : (query.filter = `id||$eq||${id}`);
    return this.paymentConditionService.findOneByCondition(query);
  }

  @Post('')
  @RequirePermissions(PERMISSIONS.DOCUMENT_SETTINGS.CREATE)
  @LogEvent(EVENT_TYPE.PAYMENT_CONDITION_CREATED)
  async save(
    @Body() createPaymentConditionDto: CreatePaymentConditionDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponsePaymentConditionDto> {
    const condition = await this.paymentConditionService.save(
      createPaymentConditionDto,
    );
    req.logInfo = { id: condition.id };
    return condition;
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/:id')
  @RequirePermissions(PERMISSIONS.DOCUMENT_SETTINGS.UPDATE)
  @LogEvent(EVENT_TYPE.PAYMENT_CONDITION_UPDATED)
  async update(
    @Param('id') id: number,
    @Body() updatePaymentConditionDto: UpdatePaymentConditionDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponsePaymentConditionDto> {
    req.logInfo = { id };
    return this.paymentConditionService.update(id, updatePaymentConditionDto);
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Delete('/:id')
  @RequirePermissions(PERMISSIONS.DOCUMENT_SETTINGS.DELETE)
  async delete(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponsePaymentConditionDto> {
    req.logInfo = { id };
    return this.paymentConditionService.softDelete(id);
  }
}
