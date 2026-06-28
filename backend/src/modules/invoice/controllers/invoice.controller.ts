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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiParam } from '@nestjs/swagger';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { InvoiceService } from '../services/invoice.service';
import { ResponseInvoiceDto } from '../dtos/invoice.response.dto';
import { CreateInvoiceDto } from '../dtos/invoice.create.dto';
import { DuplicateInvoiceDto } from '../dtos/invoice.duplicate.dto';
import { InvoiceSequence } from '../interfaces/invoice-sequence.interface';
import { UpdateInvoiceSequenceDto } from '../dtos/invoice-seqence.update.dto';
import { UpdateInvoiceDto } from '../dtos/invoice.update.dto';
import { SendInvoiceEmailDto } from '../dtos/invoice-send-email.dto';
import { ResponseInvoiceRangeDto } from '../dtos/invoice-range.response.dto';
import { LogInterceptor } from 'src/shared/logger/decorators/logger.interceptor';
import { LogEvent } from 'src/shared/logger/decorators/log-event.decorator';
import { ApiPaginatedResponse } from 'src/shared/database/decorators/api-paginated-resposne.decorator';
import { EVENT_TYPE } from 'src/shared/logger/enums/event-type.enum';
import { AdvancedRequest } from 'src/types';
import { CustomerOrderService } from 'src/modules/customer-order/services/customer-order.service';
import { CustomerOrderNotFoundException } from 'src/modules/customer-order/errors/customer-order.notfound.error';
import { InvoiceNotFoundException } from '../errors/invoice.notfound.error';
import {
  RequireAnyPermissions,
  RequirePermissions,
} from 'src/shared/auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';
import { canAccessDocumentByActivityType } from 'src/modules/user-management/rbac/contextual-lookup-permissions';
import { hasDocumentTransformationPermissions } from 'src/modules/user-management/rbac/document-transformation-permissions';

@ApiTags('invoice')
@Controller({ version: '1', path: '/invoice' })
@UseInterceptors(LogInterceptor)
@RequirePermissions(
  PERMISSIONS.SELLING_DOCUMENTS.READ,
  "Vous n'avez pas l'autorisation de consulter les factures.",
)
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly customerOrderService: CustomerOrderService,
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
  ): Promise<ResponseInvoiceDto[]> {
    return this.invoiceService.findAll(
      options,
      this.getAuthenticatedUserId(req),
    );
  }

  @Get('/list')
  @ApiPaginatedResponse(ResponseInvoiceDto)
  async findAllPaginated(
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<PageDto<ResponseInvoiceDto>> {
    return this.invoiceService.findAllPaginated(
      query,
      this.getAuthenticatedUserId(req),
    );
  }

  @Get('/sequential-range/:id')
  async findInvoicesByRange(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseInvoiceRangeDto> {
    return this.invoiceService.findInvoicesByRange(
      id,
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
    "Vous n'avez pas l'autorisation de consulter les factures.",
  )
  @ApiParam({ name: 'id', type: 'number', required: true })
  async findOneById(
    @Param('id') id: number,
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseInvoiceDto> {
    const invoice = await this.invoiceService.findOneByCondition(
      { ...query, filter: `id||$eq||${id}` },
      this.getAuthenticatedUserId(req),
    );
    if (!invoice) {
      throw new InvoiceNotFoundException();
    }
    if (
      !canAccessDocumentByActivityType(
        invoice.activityType,
        (req as AdvancedRequest & { effectivePermissionIds?: string[] })
          .effectivePermissionIds || [],
      )
    ) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation de consulter les factures.",
      );
    }
    return invoice;
  }

  @Get('/:id/download')
  @LogEvent(EVENT_TYPE.SELLING_INVOICE_PRINTED)
  async generatePdf(
    @Param('id') id: number,
    @Query() query: { template: string },
    @Request() req: AdvancedRequest,
  ) {
    req.logInfo = { id };
    return this.invoiceService.downloadPdf(
      id,
      query.template,
      this.getAuthenticatedUserId(req),
    );
  }

  @Post('')
  @RequirePermissions(
    PERMISSIONS.SELLING_DOCUMENTS.CREATE,
    "Vous n'avez pas l'autorisation de créer cette facture.",
  )
  @LogEvent(EVENT_TYPE.SELLING_INVOICE_CREATED)
  async save(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseInvoiceDto> {
    const invoice = await this.invoiceService.save(
      createInvoiceDto,
      this.getAuthenticatedUserId(req),
    );
    req.logInfo = { id: invoice.id };
    return invoice;
  }

  @Post('/from-customer-order/:id')
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
  async saveFromCustomerOrder(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseInvoiceDto> {
    const customerOrder = await this.customerOrderService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join:
          'invoices,' +
          'deliveryNotes,' +
          'goodsIssueNotes,' +
          'customerOrderMetaData,' +
          'articleCustomerOrderEntries,' +
          'articleCustomerOrderEntries.article,' +
          'articleCustomerOrderEntries.articleCustomerOrderEntryTaxes,' +
          'articleCustomerOrderEntries.articleCustomerOrderEntryTaxes.tax',
      },
      this.getAuthenticatedUserId(req),
    );

    if (!customerOrder) {
      throw new CustomerOrderNotFoundException();
    }
    if (
      !req.isAdmin &&
      !hasDocumentTransformationPermissions(
        customerOrder.activityType,
        req.effectivePermissionIds || [],
      )
    ) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation de transformer cette commande.",
      );
    }

    const invoice =
      await this.invoiceService.saveFromCustomerOrderAndValidate(customerOrder);
    req.logInfo = { customerOrderId: id, invoiceId: invoice.id };
    return invoice;
  }

  @Post('/:id/send-email')
  @RequireAnyPermissions(
    [
      PERMISSIONS.SELLING_DOCUMENTS.READ,
      PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
      PERMISSIONS.BUYING_DOCUMENTS.READ,
      PERMISSIONS.BUYING_DOCUMENTS.UPDATE,
    ],
    "Vous n'avez pas l'autorisation d'envoyer cette facture.",
  )
  @ApiParam({ name: 'id', type: 'number', required: true })
  async sendEmail(
    @Param('id') id: number,
    @Body() body: SendInvoiceEmailDto,
    @Request() req: AdvancedRequest,
  ): Promise<{ success: boolean }> {
    return this.invoiceService.sendEmail(
      id,
      body,
      this.getAuthenticatedUserId(req),
    );
  }

  @Post('/duplicate')
  @RequirePermissions(
    PERMISSIONS.SELLING_DOCUMENTS.CREATE,
    "Vous n'avez pas l'autorisation de créer cette facture.",
  )
  @LogEvent(EVENT_TYPE.SELLING_INVOICE_DUPLICATED)
  async duplicate(
    @Body() duplicateInvoiceDto: DuplicateInvoiceDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseInvoiceDto> {
    const invoice = await this.invoiceService.duplicate(
      duplicateInvoiceDto,
      this.getAuthenticatedUserId(req),
    );
    req.logInfo = { id: duplicateInvoiceDto.id, duplicateId: invoice.id };
    return invoice;
  }

  @Put('/update-invoice-sequences')
  @RequirePermissions(
    PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
    "Vous n'avez pas l'autorisation de modifier cette ressource.",
  )
  async updateInvoiceSequences(
    @Body() updatedSequenceDto: UpdateInvoiceSequenceDto,
  ): Promise<InvoiceSequence> {
    return this.invoiceService.updateInvoiceSequence(updatedSequenceDto);
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/:id')
  @RequirePermissions(
    PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
    "Vous n'avez pas l'autorisation de modifier cette facture.",
  )
  @LogEvent(EVENT_TYPE.SELLING_INVOICE_UPDATED)
  async update(
    @Param('id') id: number,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseInvoiceDto> {
    req.logInfo = { id };
    return this.invoiceService.update(
      id,
      updateInvoiceDto,
      this.getAuthenticatedUserId(req),
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Delete('/:id')
  @RequirePermissions(
    PERMISSIONS.SELLING_DOCUMENTS.DELETE,
    "Vous n'avez pas l'autorisation de supprimer cette facture.",
  )
  @LogEvent(EVENT_TYPE.SELLING_INVOICE_DELETED)
  async delete(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseInvoiceDto> {
    req.logInfo = { id };
    return this.invoiceService.softDelete(id, this.getAuthenticatedUserId(req));
  }
}
