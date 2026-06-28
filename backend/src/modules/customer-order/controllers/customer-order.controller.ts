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
  forwardRef,
  Inject,
  UseInterceptors,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiParam } from '@nestjs/swagger';
import { CustomerOrderService } from '../services/customer-order.service';
import { ResponseCustomerOrderDto } from '../dtos/customer-order.response.dto';
import { CreateCustomerOrderDto } from '../dtos/customer-order.create.dto';
import { UpdateCustomerOrderDto } from '../dtos/customer-order.update.dto';
import { UpdateCustomerOrderSequenceDto } from '../dtos/customer-order-seqence.update.dto';
import { DuplicateCustomerOrderDto } from '../dtos/customer-order.duplicate.dto';
import { CustomerOrderSequence } from '../interfaces/customer-order-sequence.interface';
import { CUSTOMER_ORDER_STATUS } from '../enums/customer-order-status.enum';
import { InvoiceService } from 'src/modules/invoice/services/invoice.service';
import { QuotationService } from 'src/modules/quotation/services/quotation.service';
import { LogInterceptor } from 'src/shared/logger/decorators/logger.interceptor';
import { LogEvent } from 'src/shared/logger/decorators/log-event.decorator';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { ApiPaginatedResponse } from 'src/shared/database/decorators/api-paginated-resposne.decorator';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { EVENT_TYPE } from 'src/shared/logger/enums/event-type.enum';
import { AdvancedRequest } from 'src/types';
import { CustomerOrderLifecycleService } from '../services/customer-order-lifecycle.service';
import { CustomerOrderNotFoundException } from '../errors/customer-order.notfound.error';
import {
  RequireAnyPermissions,
  RequirePermissions,
} from 'src/shared/auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';
import { canAccessDocumentByActivityType } from 'src/modules/user-management/rbac/contextual-lookup-permissions';
import { hasDocumentTransformationPermissions } from 'src/modules/user-management/rbac/document-transformation-permissions';
import { SendDocumentEmailDto } from 'src/shared/mail/dtos/send-document-email.dto';

@ApiTags('customerOrder')
@Controller({ version: '1', path: '/customerOrder' })
@UseInterceptors(LogInterceptor)
@RequirePermissions(
  PERMISSIONS.SELLING_DOCUMENTS.READ,
  "Vous n'avez pas l'autorisation de consulter cette ressource.",
)
export class CustomerOrderController {
  constructor(
    private readonly customerOrderService: CustomerOrderService,
    private readonly invoiceService: InvoiceService,
    private readonly customerOrderLifecycleService: CustomerOrderLifecycleService,
    @Inject(forwardRef(() => QuotationService))
    private readonly quotationService: QuotationService,
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
  ): Promise<ResponseCustomerOrderDto[]> {
    return this.customerOrderService.findAll(
      options,
      this.getAuthenticatedUserId(req),
    );
  }

  @Get('/list')
  @ApiPaginatedResponse(ResponseCustomerOrderDto)
  async findAllPaginated(
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<PageDto<ResponseCustomerOrderDto>> {
    return this.customerOrderService.findAllPaginated(
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
  ): Promise<ResponseCustomerOrderDto> {
    const customerOrder = await this.customerOrderService.findOneByCondition(
      {
        ...query,
        filter: query.filter
          ? `${query.filter};id||$eq||${id}`
          : `id||$eq||${id}`,
      },
      this.getAuthenticatedUserId(req),
    );
    if (!customerOrder) {
      throw new CustomerOrderNotFoundException();
    }
    if (
      !canAccessDocumentByActivityType(
        customerOrder.activityType,
        (req as AdvancedRequest & { effectivePermissionIds?: string[] })
          .effectivePermissionIds || [],
      )
    ) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation de consulter cette ressource.",
      );
    }
    return customerOrder;
  }

  @Get('/:id/download')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="customerOrder.pdf"')
  @LogEvent(EVENT_TYPE.SELLING_CUSTOMER_ORDER_PRINTED)
  async generatePdf(
    @Param('id') id: number,
    @Query() query: { template: string },
    @Request() req: AdvancedRequest,
  ) {
    req.logInfo = { id };
    return this.customerOrderService.downloadPdf(
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
    return this.customerOrderService.sendEmail(
      id,
      body,
      this.getAuthenticatedUserId(req),
    );
  }

  @Post('')
  @RequirePermissions(
    PERMISSIONS.SELLING_DOCUMENTS.CREATE,
    "Vous n'avez pas l'autorisation de créer cette ressource.",
  )
  @LogEvent(EVENT_TYPE.SELLING_CUSTOMER_ORDER_CREATED)
  async save(
    @Body() createCustomerOrderDto: CreateCustomerOrderDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseCustomerOrderDto> {
    const customerOrder = await this.customerOrderService.save(
      createCustomerOrderDto,
      this.getAuthenticatedUserId(req),
    );
    req.logInfo = { id: customerOrder.id };
    return customerOrder;
  }

  @Post('/duplicate')
  @RequirePermissions(
    PERMISSIONS.SELLING_DOCUMENTS.CREATE,
    "Vous n'avez pas l'autorisation de créer cette ressource.",
  )
  @LogEvent(EVENT_TYPE.SELLING_CUSTOMER_ORDER_DUPLICATED)
  async duplicate(
    @Body() duplicateCustomerOrderDto: DuplicateCustomerOrderDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseCustomerOrderDto> {
    const customerOrder = await this.customerOrderService.duplicate(
      duplicateCustomerOrderDto,
      this.getAuthenticatedUserId(req),
    );
    req.logInfo = {
      id: duplicateCustomerOrderDto.id,
      duplicateId: customerOrder.id,
    };
    return customerOrder;
  }

  @Put('/update-customer-order-sequences')
  @RequirePermissions(
    PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
    "Vous n'avez pas l'autorisation de modifier cette ressource.",
  )
  @ApiParam({ name: 'id', type: 'number', required: true })
  async updateCustomerOrderSequences(
    @Body() updatedSequenceDto: UpdateCustomerOrderSequenceDto,
  ): Promise<CustomerOrderSequence> {
    return this.customerOrderService.updateCustomerOrderSequence(
      updatedSequenceDto,
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Post('/:id/validate')
  @RequirePermissions(
    PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
    "Vous n'avez pas l'autorisation de modifier cette ressource.",
  )
  @LogEvent(EVENT_TYPE.SELLING_CUSTOMER_ORDER_UPDATED)
  async validate(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseCustomerOrderDto> {
    req.logInfo = { id };
    const userId = this.getAuthenticatedUserId(req);
    await this.customerOrderService.findOneById(id, userId);
    await this.customerOrderLifecycleService.validate(id);
    return this.customerOrderService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'firm,interlocutor,currency,invoices,deliveryNotes,goodsIssueNotes',
      },
      userId,
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Post('/:id/cancel')
  @RequirePermissions(
    PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
    "Vous n'avez pas l'autorisation de modifier cette ressource.",
  )
  @LogEvent(EVENT_TYPE.SELLING_CUSTOMER_ORDER_UPDATED)
  async cancel(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseCustomerOrderDto> {
    req.logInfo = { id };
    const userId = this.getAuthenticatedUserId(req);
    await this.customerOrderService.findOneById(id, userId);
    await this.customerOrderLifecycleService.cancel(id);
    return this.customerOrderService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'firm,interlocutor,currency,invoices,deliveryNotes,goodsIssueNotes',
      },
      userId,
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @ApiParam({ name: 'create', type: 'boolean', required: false })
  @Put('/invoice/:id/:create')
  @RequireAnyPermissions(
    [
      PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
      PERMISSIONS.SELLING_DOCUMENTS.CREATE,
      PERMISSIONS.BUYING_DOCUMENTS.UPDATE,
      PERMISSIONS.BUYING_DOCUMENTS.CREATE,
    ],
    "Vous n'avez pas l'autorisation de transformer cette commande.",
  )
  @LogEvent(EVENT_TYPE.SELLING_CUSTOMER_ORDER_INVOICED)
  async invoice(
    @Param('id') id: number,
    @Param('create') create: string,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseCustomerOrderDto> {
    const userId = this.getAuthenticatedUserId(req);
    req.logInfo = { customerOrderId: id, invoiceId: null };
    const shouldCreateInvoice = create !== 'false';
    const customerOrder = await this.customerOrderService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join:
          'invoices,' +
          'deliveryNotes,' +
          'goodsIssueNotes,' +
          'customerOrderMetaData,' +
          'articleCustomerOrderEntries,' +
          `articleCustomerOrderEntries.article,` +
          `articleCustomerOrderEntries.articleCustomerOrderEntryTaxes,` +
          `articleCustomerOrderEntries.articleCustomerOrderEntryTaxes.tax`,
      },
      userId,
    );
    if (
      !req.isAdmin &&
      !hasDocumentTransformationPermissions(
        customerOrder.activityType,
        req.effectivePermissionIds || [],
        shouldCreateInvoice,
      )
    ) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation de transformer cette commande.",
      );
    }
    this.customerOrderLifecycleService.assertCanTransformToInvoice(
      customerOrder,
    );
    if ((customerOrder.articleCustomerOrderEntries?.length ?? 0) === 0) {
      throw new BadRequestException(
        'customerOrder.errors.missing_article_entries',
      );
    }

    if (shouldCreateInvoice) {
      const invoice =
        await this.invoiceService.saveFromCustomerOrder(customerOrder);
      req.logInfo.invoiceId = invoice.id;
    }
    await this.customerOrderLifecycleService.markValidatedByTransformation(id);
    return this.customerOrderService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'invoices,deliveryNotes,goodsIssueNotes',
      },
      userId,
    );
  }

  @Post('/from-quotation/:id')
  @RequirePermissions(
    PERMISSIONS.SELLING_DOCUMENTS.CREATE,
    "Vous n'avez pas l'autorisation de créer cette ressource.",
  )
  async saveFromQuotation(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ) {
    const quotation = await this.quotationService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join:
          'articleQuotationEntries,' +
          'articleQuotationEntries.article,' +
          'articleQuotationEntries.articleQuotationEntryTaxes,' +
          'articleQuotationEntries.articleQuotationEntryTaxes.tax',
      },
      this.getAuthenticatedUserId(req),
    );
    return this.customerOrderService.saveFromQuotation(quotation);
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/:id/status')
  @RequirePermissions(
    PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
    "Vous n'avez pas l'autorisation de modifier cette ressource.",
  )
  @LogEvent(EVENT_TYPE.SELLING_CUSTOMER_ORDER_UPDATED)
  async updateStatus(
    @Param('id') id: number,
    @Body('status') status: CUSTOMER_ORDER_STATUS,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseCustomerOrderDto> {
    req.logInfo = { id };
    const userId = this.getAuthenticatedUserId(req);
    await this.customerOrderService.updateStatus(id, status, userId);
    return this.customerOrderService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'firm,interlocutor,currency,invoices,deliveryNotes,goodsIssueNotes',
      },
      userId,
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/:id')
  @RequirePermissions(
    PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
    "Vous n'avez pas l'autorisation de modifier cette ressource.",
  )
  @LogEvent(EVENT_TYPE.SELLING_CUSTOMER_ORDER_UPDATED)
  async update(
    @Param('id') id: number,
    @Body() updateCustomerOrderDto: UpdateCustomerOrderDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseCustomerOrderDto> {
    req.logInfo = { id };
    return this.customerOrderService.update(
      id,
      updateCustomerOrderDto,
      this.getAuthenticatedUserId(req),
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Delete('/:id')
  @RequirePermissions(
    PERMISSIONS.SELLING_DOCUMENTS.DELETE,
    "Vous n'avez pas l'autorisation de supprimer cette ressource.",
  )
  @LogEvent(EVENT_TYPE.SELLING_CUSTOMER_ORDER_DELETED)
  async delete(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseCustomerOrderDto> {
    req.logInfo = { id };
    return this.customerOrderService.softDelete(
      id,
      this.getAuthenticatedUserId(req),
    );
  }
}
