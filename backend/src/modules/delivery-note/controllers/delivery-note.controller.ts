import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseInterceptors,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiParam } from '@nestjs/swagger';
import { DeliveryNoteService } from '../services/delivery-note.service';
import { ResponseDeliveryNoteDto } from '../dtos/delivery-note.response.dto';
import { CreateDeliveryNoteDto } from '../dtos/delivery-note.create.dto';
import { UpdateDeliveryNoteDto } from '../dtos/delivery-note.update.dto';
import { UpdateDeliveryNoteSequenceDto } from '../dtos/delivery-note-seqence.update.dto';
import { DuplicateDeliveryNoteDto } from '../dtos/delivery-note.duplicate.dto';
import { DeliveryNoteSequence } from '../interfaces/delivery-note-sequence.interface';
import { DELIVERY_NOTE_STATUS } from '../enums/delivery-note-status.enum';
import { DeliveryNoteLifecycleService } from '../services/delivery-note-lifecycle.service';
import { InvoiceService } from 'src/modules/invoice/services/invoice.service';
import { LogInterceptor } from 'src/shared/logger/decorators/logger.interceptor';
import { LogEvent } from 'src/shared/logger/decorators/log-event.decorator';
import { QuotationService } from 'src/modules/quotation/services/quotation.service';
import { CustomerOrderService } from 'src/modules/customer-order/services/customer-order.service';
import { GoodsIssueNoteService } from 'src/modules/goods-issue-note/services/goods-issue-note.service';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { ApiPaginatedResponse } from 'src/shared/database/decorators/api-paginated-resposne.decorator';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { EVENT_TYPE } from 'src/shared/logger/enums/event-type.enum';
import { AdvancedRequest } from 'src/types';
import { DeliveryNoteNotFoundException } from '../errors/delivery-note.notfound.error';
import {
  RequireAnyPermissions,
  RequirePermissions,
} from 'src/shared/auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';
import { canAccessDocumentByActivityType } from 'src/modules/user-management/rbac/contextual-lookup-permissions';
import { SendDocumentEmailDto } from 'src/shared/mail/dtos/send-document-email.dto';

@ApiTags('deliveryNote')
@Controller({ version: '1', path: '/deliveryNote' })
@UseInterceptors(LogInterceptor)
@RequirePermissions(
  PERMISSIONS.SELLING_DOCUMENTS.READ,
  "Vous n'avez pas l'autorisation de consulter cette ressource.",
)
export class DeliveryNoteController {
  constructor(
    private readonly deliveryNoteService: DeliveryNoteService,
    private readonly deliveryNoteLifecycleService: DeliveryNoteLifecycleService,
    private readonly invoiceService: InvoiceService,
    private readonly quotationService: QuotationService,
    private readonly customerOrderService: CustomerOrderService,
    private readonly goodsIssueNoteService: GoodsIssueNoteService,
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
  ): Promise<ResponseDeliveryNoteDto[]> {
    return this.deliveryNoteService.findAll(
      options,
      this.getAuthenticatedUserId(req),
    );
  }

  @Get('/list')
  @ApiPaginatedResponse(ResponseDeliveryNoteDto)
  async findAllPaginated(
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<PageDto<ResponseDeliveryNoteDto>> {
    return this.deliveryNoteService.findAllPaginated(
      query,
      this.getAuthenticatedUserId(req),
    );
  }

  @Get('/:id')
  @RequireAnyPermissions(
    [
      PERMISSIONS.SELLING_DOCUMENTS.READ,
      PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
      PERMISSIONS.BUYING_DOCUMENTS.READ,
      PERMISSIONS.BUYING_DOCUMENTS.UPDATE,
    ],
    "Vous n'avez pas l'autorisation de consulter cette ressource.",
  )
  @ApiParam({ name: 'id', type: 'number', required: true })
  async findOneById(
    @Param('id') id: number,
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseDeliveryNoteDto> {
    const deliveryNote = await this.deliveryNoteService.findOneByCondition(
      {
        ...query,
        filter: query.filter
          ? `${query.filter};id||$eq||${id}`
          : `id||$eq||${id}`,
      },
      this.getAuthenticatedUserId(req),
    );
    if (!deliveryNote) {
      throw new DeliveryNoteNotFoundException();
    }
    if (
      !canAccessDocumentByActivityType(
        deliveryNote.activityType,
        (req as AdvancedRequest & { effectivePermissionIds?: string[] })
          .effectivePermissionIds || [],
      )
    ) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation de consulter cette ressource.",
      );
    }
    return deliveryNote;
  }

  @Get('/:id/download')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="deliveryNote.pdf"')
  @LogEvent(EVENT_TYPE.SELLING_DELIVERY_NOTE_PRINTED)
  async generatePdf(
    @Param('id') id: number,
    @Query() query: { template: string },
    @Request() req: AdvancedRequest,
  ) {
    req.logInfo = { id };
    return this.deliveryNoteService.downloadPdf(
      id,
      query.template,
      this.getAuthenticatedUserId(req),
    );
  }

  @Post('/:id/send-email')
  @RequireAnyPermissions(
    [
      PERMISSIONS.SELLING_DOCUMENTS.READ,
      PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
      PERMISSIONS.BUYING_DOCUMENTS.READ,
      PERMISSIONS.BUYING_DOCUMENTS.UPDATE,
    ],
    "Vous n'avez pas l'autorisation d'envoyer ce document.",
  )
  @ApiParam({ name: 'id', type: 'number', required: true })
  async sendEmail(
    @Param('id') id: number,
    @Body() body: SendDocumentEmailDto,
    @Request() req: AdvancedRequest,
  ): Promise<{ success: boolean }> {
    return this.deliveryNoteService.sendEmail(
      id,
      body,
      this.getAuthenticatedUserId(req),
    );
  }

  @Post('')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.CREATE)
  @LogEvent(EVENT_TYPE.SELLING_DELIVERY_NOTE_CREATED)
  async save(
    @Body() createDeliveryNoteDto: CreateDeliveryNoteDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseDeliveryNoteDto> {
    const deliveryNote = await this.deliveryNoteService.save(
      createDeliveryNoteDto,
      this.getAuthenticatedUserId(req),
    );
    req.logInfo = { id: deliveryNote.id };
    return deliveryNote;
  }

  @Post('/duplicate')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.CREATE)
  @LogEvent(EVENT_TYPE.SELLING_DELIVERY_NOTE_DUPLICATED)
  async duplicate(
    @Body() duplicateDeliveryNoteDto: DuplicateDeliveryNoteDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseDeliveryNoteDto> {
    const deliveryNote = await this.deliveryNoteService.duplicate(
      duplicateDeliveryNoteDto,
      this.getAuthenticatedUserId(req),
    );
    req.logInfo = {
      id: duplicateDeliveryNoteDto.id,
      duplicateId: deliveryNote.id,
    };
    return deliveryNote;
  }

  @Put('/update-delivery-note-sequences')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.UPDATE)
  @ApiParam({ name: 'id', type: 'number', required: true })
  async updateDeliveryNoteSequences(
    @Body() updatedSequenceDto: UpdateDeliveryNoteSequenceDto,
  ): Promise<DeliveryNoteSequence> {
    return this.deliveryNoteService.updateDeliveryNoteSequence(
      updatedSequenceDto,
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Post('/:id/validate')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.UPDATE)
  @LogEvent(EVENT_TYPE.SELLING_DELIVERY_NOTE_UPDATED)
  async validate(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseDeliveryNoteDto> {
    req.logInfo = { id };
    const userId = this.getAuthenticatedUserId(req);
    await this.deliveryNoteService.findOneById(id, userId);
    await this.deliveryNoteLifecycleService.validate(id);
    return this.deliveryNoteService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'firm,interlocutor,currency,invoices,returnNotes,customerOrder',
      },
      userId,
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Post('/:id/deliver')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.UPDATE)
  @LogEvent(EVENT_TYPE.SELLING_DELIVERY_NOTE_UPDATED)
  async deliver(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseDeliveryNoteDto> {
    req.logInfo = { id };
    const userId = this.getAuthenticatedUserId(req);
    await this.deliveryNoteService.findOneById(id, userId);
    await this.deliveryNoteLifecycleService.deliver(id);
    return this.deliveryNoteService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'firm,interlocutor,currency,invoices,returnNotes,customerOrder',
      },
      userId,
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Post('/:id/cancel')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.UPDATE)
  @LogEvent(EVENT_TYPE.SELLING_DELIVERY_NOTE_UPDATED)
  async cancel(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseDeliveryNoteDto> {
    req.logInfo = { id };
    const userId = this.getAuthenticatedUserId(req);
    await this.deliveryNoteService.findOneById(id, userId);
    await this.deliveryNoteLifecycleService.cancel(id);
    return this.deliveryNoteService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'firm,interlocutor,currency,invoices,returnNotes,customerOrder',
      },
      userId,
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @ApiParam({ name: 'create', type: 'boolean', required: false })
  @Put('/invoice/:id/:create')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.UPDATE)
  @LogEvent(EVENT_TYPE.SELLING_DELIVERY_NOTE_INVOICED)
  async invoice(
    @Param('id') id: number,
    @Param('create') create: string,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseDeliveryNoteDto> {
    const userId = this.getAuthenticatedUserId(req);
    req.logInfo = { deliveryNoteId: id, invoiceId: null };
    const shouldCreateInvoice = create !== 'false';
    const deliveryNote = await this.deliveryNoteService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join:
          'invoices,' +
          'returnNotes,' +
          'customerOrder,' +
          'deliveryNoteMetaData,' +
          'articleDeliveryNoteEntries,' +
          `articleDeliveryNoteEntries.article,` +
          `articleDeliveryNoteEntries.articleDeliveryNoteEntryTaxes,` +
          `articleDeliveryNoteEntries.articleDeliveryNoteEntryTaxes.tax`,
      },
      userId,
    );
    this.deliveryNoteLifecycleService.assertCanCreateInvoice(deliveryNote);
    if ((deliveryNote.articleDeliveryNoteEntries?.length ?? 0) === 0) {
      throw new BadRequestException(
        'deliveryNote.errors.missing_article_entries',
      );
    }

    if (shouldCreateInvoice) {
      if (deliveryNote.status !== DELIVERY_NOTE_STATUS.Delivered) {
        await this.deliveryNoteLifecycleService.markDeliveredByTransformation(
          id,
        );
      }
      const invoice =
        await this.invoiceService.saveFromDeliveryNote(deliveryNote);
      req.logInfo.invoiceId = invoice.id;
    } else if (deliveryNote.status !== DELIVERY_NOTE_STATUS.Delivered) {
      await this.deliveryNoteLifecycleService.markDeliveredByTransformation(id);
    }
    return this.deliveryNoteService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'invoices,returnNotes,customerOrder',
      },
      userId,
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/:id/status')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.UPDATE)
  @LogEvent(EVENT_TYPE.SELLING_DELIVERY_NOTE_UPDATED)
  async updateStatus(
    @Param('id') id: number,
    @Body('status') status: DELIVERY_NOTE_STATUS,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseDeliveryNoteDto> {
    req.logInfo = { id };
    const userId = this.getAuthenticatedUserId(req);
    await this.deliveryNoteService.findOneById(id, userId);
    await this.deliveryNoteLifecycleService.updateStatus(id, status);
    return this.deliveryNoteService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'firm,interlocutor,currency,invoices,returnNotes,customerOrder',
      },
      userId,
    );
  }

  @Post('/from-quotation/:id')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.CREATE)
  async saveFromQuotation(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ) {
    const quotation = await this.quotationService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'articleQuotationEntries,articleQuotationEntries.article,articleQuotationEntries.articleQuotationEntryTaxes',
      },
      this.getAuthenticatedUserId(req),
    );
    return this.deliveryNoteService.saveFromQuotation(quotation);
  }

  @Post('/from-invoice/:id')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.CREATE)
  async saveFromInvoice(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ) {
    const invoice = await this.invoiceService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'articleInvoiceEntries,articleInvoiceEntries.article,articleInvoiceEntries.articleInvoiceEntryTaxes',
      },
      this.getAuthenticatedUserId(req),
    );
    return this.deliveryNoteService.saveFromInvoice(invoice);
  }

  @Post('/from-customer-order/:id')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.CREATE)
  async saveFromCustomerOrder(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ) {
    const customerOrder = await this.customerOrderService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join:
          'invoices,' +
          'deliveryNotes,' +
          'goodsIssueNotes,' +
          'articleCustomerOrderEntries,' +
          'articleCustomerOrderEntries.article,' +
          'articleCustomerOrderEntries.articleCustomerOrderEntryTaxes',
      },
      this.getAuthenticatedUserId(req),
    );
    return this.deliveryNoteService.saveFromCustomerOrderAndValidate(
      customerOrder,
    );
  }

  @Post('/from-goods-issue-note/:id')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.CREATE)
  async saveFromGoodsIssueNote(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ) {
    const goodsIssueNote = await this.goodsIssueNoteService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join:
          'goodsIssueNoteMetaData,' +
          'articleGoodsIssueNoteEntries,' +
          'articleGoodsIssueNoteEntries.article,' +
          'articleGoodsIssueNoteEntries.articleGoodsIssueNoteEntryTaxes',
      },
      this.getAuthenticatedUserId(req),
    );
    return this.deliveryNoteService.saveFromGoodsIssueNote(goodsIssueNote);
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/:id')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.UPDATE)
  @LogEvent(EVENT_TYPE.SELLING_DELIVERY_NOTE_UPDATED)
  async update(
    @Param('id') id: number,
    @Body() updateDeliveryNoteDto: UpdateDeliveryNoteDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseDeliveryNoteDto> {
    req.logInfo = { id };
    return this.deliveryNoteService.update(
      id,
      updateDeliveryNoteDto,
      this.getAuthenticatedUserId(req),
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Delete('/:id')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.DELETE)
  @LogEvent(EVENT_TYPE.SELLING_DELIVERY_NOTE_DELETED)
  async delete(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseDeliveryNoteDto> {
    req.logInfo = { id };
    return this.deliveryNoteService.softDelete(
      id,
      this.getAuthenticatedUserId(req),
    );
  }
}
