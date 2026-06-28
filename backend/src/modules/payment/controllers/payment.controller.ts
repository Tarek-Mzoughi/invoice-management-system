import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  StreamableFile,
  UseInterceptors,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiParam } from '@nestjs/swagger';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { PaymentService } from '../services/payment.service';
import { ResponsePaymentDto } from '../dtos/payment.response.dto';
import { CreatePaymentDto } from '../dtos/payment.create.dto';
import { UpdatePaymentDto } from '../dtos/payment.update.dto';
import { LogInterceptor } from 'src/shared/logger/decorators/logger.interceptor';
import { LogEvent } from 'src/shared/logger/decorators/log-event.decorator';
import { ApiPaginatedResponse } from 'src/shared/database/decorators/api-paginated-resposne.decorator';
import { EVENT_TYPE } from 'src/shared/logger/enums/event-type.enum';
import { AdvancedRequest } from 'src/types';
import { DepositPaymentDto } from '../dtos/payment.deposit.dto';
import { RejectPaymentDto } from '../dtos/payment.reject.dto';
import { PaymentReceiptPdfService } from '../services/payment-receipt-pdf.service';
import { PaymentNotFoundException } from '../errors/payment.notfound.error';
import { RequirePermissions } from 'src/shared/auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';

@ApiTags('payment')
@Controller({ version: '1', path: '/payment' })
@UseInterceptors(LogInterceptor)
@RequirePermissions(
  PERMISSIONS.PAYMENTS.READ,
  "Vous n'avez pas l'autorisation de consulter les paiements.",
)
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly paymentReceiptPdfService: PaymentReceiptPdfService,
  ) {}

  private getAuthenticatedUserId(req: AdvancedRequest): string {
    if (!req.user?.sub) {
      throw new ForbiddenException('Authenticated user is required');
    }
    return req.user.sub;
  }

  @Get('/all')
  async findAll(
    @Query() options: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<ResponsePaymentDto[]> {
    return this.paymentService.findAll(
      options,
      this.getAuthenticatedUserId(req),
    );
  }

  @Get('/list')
  @ApiPaginatedResponse(ResponsePaymentDto)
  async findAllPaginated(
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<PageDto<ResponsePaymentDto>> {
    return this.paymentService.findAllPaginated(
      query,
      this.getAuthenticatedUserId(req),
    );
  }

  @Get('/:id/receipt/preview')
  @ApiParam({ name: 'id', type: 'number', required: true })
  async previewReceipt(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<StreamableFile> {
    const receipt = await this.paymentReceiptPdfService.generateReceiptPdf(
      Number(id),
      req.user?.sub,
    );
    return this.toPdfStream(receipt.pdfBuffer, receipt.filename, 'inline');
  }

  @Get('/:id/receipt/download')
  @ApiParam({ name: 'id', type: 'number', required: true })
  async downloadReceipt(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<StreamableFile> {
    const receipt = await this.paymentReceiptPdfService.generateReceiptPdf(
      Number(id),
      req.user?.sub,
    );
    return this.toPdfStream(receipt.pdfBuffer, receipt.filename, 'attachment');
  }

  @Get('/:id')
  @ApiParam({ name: 'id', type: 'number', required: true })
  async findOneById(
    @Param('id') id: number,
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<ResponsePaymentDto> {
    const payment = await this.paymentService.findOneByCondition(
      {
        ...query,
        filter: query.filter
          ? `${query.filter};id||$eq||${id}`
          : `id||$eq||${id}`,
      },
      this.getAuthenticatedUserId(req),
    );
    if (!payment) {
      throw new PaymentNotFoundException();
    }
    return payment;
  }

  @Post('')
  @RequirePermissions(
    PERMISSIONS.PAYMENTS.CREATE,
    "Vous n'avez pas l'autorisation de créer cette ressource.",
  )
  @LogEvent(EVENT_TYPE.SELLING_PAYMENT_CREATED)
  async save(
    @Body() createPaymentDto: CreatePaymentDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponsePaymentDto> {
    const payment = await this.paymentService.save(
      createPaymentDto,
      this.getAuthenticatedUserId(req),
    );
    req.logInfo = { id: payment.id };
    return payment;
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/:id')
  @RequirePermissions(
    PERMISSIONS.PAYMENTS.UPDATE,
    "Vous n'avez pas l'autorisation de modifier cette ressource.",
  )
  @LogEvent(EVENT_TYPE.SELLING_PAYMENT_UPDATED)
  async update(
    @Param('id') id: number,
    @Body() updateActivityDto: UpdatePaymentDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponsePaymentDto> {
    req.logInfo = { id };
    return this.paymentService.update(
      id,
      updateActivityDto,
      this.getAuthenticatedUserId(req),
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Patch('/:id/remove-withholding')
  @RequirePermissions(
    PERMISSIONS.PAYMENTS.UPDATE,
    "Vous n'avez pas l'autorisation de modifier cette ressource.",
  )
  @LogEvent(EVENT_TYPE.SELLING_PAYMENT_UPDATED)
  async removeWithholding(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponsePaymentDto> {
    req.logInfo = { id };
    return this.paymentService.removeWithholding(
      id,
      this.getAuthenticatedUserId(req),
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Delete('/:id')
  @RequirePermissions(
    PERMISSIONS.PAYMENTS.DELETE,
    "Vous n'avez pas l'autorisation de supprimer cette ressource.",
  )
  @LogEvent(EVENT_TYPE.SELLING_PAYMENT_DELETED)
  async delete(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponsePaymentDto> {
    req.logInfo = { id };
    return this.paymentService.softDelete(id, this.getAuthenticatedUserId(req));
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Post('/:id/deposit')
  @RequirePermissions(
    PERMISSIONS.PAYMENTS.UPDATE,
    "Vous n'avez pas l'autorisation de modifier cette ressource.",
  )
  async deposit(
    @Param('id') id: number,
    @Body() body: DepositPaymentDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponsePaymentDto> {
    return this.paymentService.depositInstrument(
      id,
      body.bankAccountId,
      this.getAuthenticatedUserId(req),
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Post('/:id/mark-paid')
  @RequirePermissions(
    PERMISSIONS.PAYMENTS.UPDATE,
    "Vous n'avez pas l'autorisation de modifier cette ressource.",
  )
  async markPaid(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponsePaymentDto> {
    return this.paymentService.markInstrumentPaid(
      id,
      this.getAuthenticatedUserId(req),
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Post('/:id/reject')
  @RequirePermissions(
    PERMISSIONS.PAYMENTS.UPDATE,
    "Vous n'avez pas l'autorisation de modifier cette ressource.",
  )
  async reject(
    @Param('id') id: number,
    @Body() body: RejectPaymentDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponsePaymentDto> {
    return this.paymentService.rejectInstrument(
      id,
      body.reason,
      this.getAuthenticatedUserId(req),
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Post('/:id/cancel-deposit')
  @RequirePermissions(
    PERMISSIONS.PAYMENTS.UPDATE,
    "Vous n'avez pas l'autorisation de modifier cette ressource.",
  )
  async cancelDeposit(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponsePaymentDto> {
    return this.paymentService.cancelInstrumentDeposit(
      id,
      this.getAuthenticatedUserId(req),
    );
  }

  private toPdfStream(
    pdfBuffer: Buffer,
    filename: string,
    disposition: 'inline' | 'attachment',
  ): StreamableFile {
    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `${disposition}; filename="${filename}"`,
    });
  }
}
