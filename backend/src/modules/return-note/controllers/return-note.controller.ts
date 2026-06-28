import {
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
import { ReturnNoteService } from '../services/return-note.service';
import { ResponseReturnNoteDto } from '../dtos/return-note.response.dto';
import { CreateReturnNoteDto } from '../dtos/return-note.create.dto';
import { UpdateReturnNoteDto } from '../dtos/return-note.update.dto';
import { UpdateReturnNoteSequenceDto } from '../dtos/return-note-seqence.update.dto';
import { DuplicateReturnNoteDto } from '../dtos/return-note.duplicate.dto';
import { ReturnNoteSequence } from '../interfaces/return-note-sequence.interface';
import { RETURN_NOTE_STATUS } from '../enums/return-note-status.enum';
import { InvoiceService } from 'src/modules/invoice/services/invoice.service';
import { LogInterceptor } from 'src/shared/logger/decorators/logger.interceptor';
import { LogEvent } from 'src/shared/logger/decorators/log-event.decorator';
import { DeliveryNoteService } from 'src/modules/delivery-note/services/delivery-note.service';
import { GoodsIssueNoteService } from 'src/modules/goods-issue-note/services/goods-issue-note.service';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { ApiPaginatedResponse } from 'src/shared/database/decorators/api-paginated-resposne.decorator';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { EVENT_TYPE } from 'src/shared/logger/enums/event-type.enum';
import { AdvancedRequest } from 'src/types';
import { ReturnNoteNotFoundException } from '../errors/return-note.notfound.error';
import {
  RequireAnyPermissions,
  RequirePermissions,
} from 'src/shared/auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';
import { canAccessDocumentByActivityType } from 'src/modules/user-management/rbac/contextual-lookup-permissions';
import { SendDocumentEmailDto } from 'src/shared/mail/dtos/send-document-email.dto';

@ApiTags('returnNote')
@Controller({ version: '1', path: '/returnNote' })
@UseInterceptors(LogInterceptor)
@RequirePermissions(
  PERMISSIONS.SELLING_DOCUMENTS.READ,
  "Vous n'avez pas l'autorisation de consulter cette ressource.",
)
export class ReturnNoteController {
  constructor(
    private readonly returnNoteService: ReturnNoteService,
    private readonly invoiceService: InvoiceService,
    private readonly deliveryNoteService: DeliveryNoteService,
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
  ): Promise<ResponseReturnNoteDto[]> {
    return this.returnNoteService.findAll(
      options,
      this.getAuthenticatedUserId(req),
    );
  }

  @Get('/list')
  @ApiPaginatedResponse(ResponseReturnNoteDto)
  async findAllPaginated(
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<PageDto<ResponseReturnNoteDto>> {
    return this.returnNoteService.findAllPaginated(
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
  ): Promise<ResponseReturnNoteDto> {
    const returnNote = await this.returnNoteService.findOneByCondition(
      {
        ...query,
        filter: query.filter
          ? `${query.filter};id||$eq||${id}`
          : `id||$eq||${id}`,
      },
      this.getAuthenticatedUserId(req),
    );
    if (!returnNote) {
      throw new ReturnNoteNotFoundException();
    }
    if (
      !canAccessDocumentByActivityType(
        returnNote.activityType,
        (req as AdvancedRequest & { effectivePermissionIds?: string[] })
          .effectivePermissionIds || [],
      )
    ) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation de consulter cette ressource.",
      );
    }
    return returnNote;
  }

  @Get('/:id/download')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="returnNote.pdf"')
  @LogEvent(EVENT_TYPE.SELLING_RETURN_NOTE_PRINTED)
  async generatePdf(
    @Param('id') id: number,
    @Query() query: { template: string },
    @Request() req: AdvancedRequest,
  ) {
    req.logInfo = { id };
    return this.returnNoteService.downloadPdf(
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
    return this.returnNoteService.sendEmail(
      id,
      body,
      this.getAuthenticatedUserId(req),
    );
  }

  @Post('')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.CREATE)
  @LogEvent(EVENT_TYPE.SELLING_RETURN_NOTE_CREATED)
  async save(
    @Body() createReturnNoteDto: CreateReturnNoteDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseReturnNoteDto> {
    const returnNote = await this.returnNoteService.save(
      createReturnNoteDto,
      this.getAuthenticatedUserId(req),
    );
    req.logInfo = { id: returnNote.id };
    return returnNote;
  }

  @Post('/duplicate')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.CREATE)
  @LogEvent(EVENT_TYPE.SELLING_RETURN_NOTE_DUPLICATED)
  async duplicate(
    @Body() duplicateReturnNoteDto: DuplicateReturnNoteDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseReturnNoteDto> {
    const returnNote = await this.returnNoteService.duplicate(
      duplicateReturnNoteDto,
      this.getAuthenticatedUserId(req),
    );
    req.logInfo = { id: duplicateReturnNoteDto.id, duplicateId: returnNote.id };
    return returnNote;
  }

  @Put('/update-return-note-sequences')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.UPDATE)
  @ApiParam({ name: 'id', type: 'number', required: true })
  async updateReturnNoteSequences(
    @Body() updatedSequenceDto: UpdateReturnNoteSequenceDto,
  ): Promise<ReturnNoteSequence> {
    return this.returnNoteService.updateReturnNoteSequence(updatedSequenceDto);
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @ApiParam({ name: 'create', type: 'boolean', required: false })
  @Put('/invoice/:id/:create')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.UPDATE)
  @LogEvent(EVENT_TYPE.SELLING_RETURN_NOTE_INVOICED)
  async invoice(
    @Param('id') id: number,
    @Param('create') create: boolean,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseReturnNoteDto> {
    const userId = this.getAuthenticatedUserId(req);
    req.logInfo = { returnNoteId: id, invoiceId: null };
    const returnNote = await this.returnNoteService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join:
          'returnNoteMetaData,' +
          'articleReturnNoteEntries,' +
          `articleReturnNoteEntries.article,` +
          `articleReturnNoteEntries.articleReturnNoteEntryTaxes,` +
          `articleReturnNoteEntries.articleReturnNoteEntryTaxes.tax`,
      },
      userId,
    );
    if (returnNote.status === RETURN_NOTE_STATUS.Invoiced || create) {
      const invoice = await this.invoiceService.saveFromReturnNote(returnNote);
      req.logInfo.invoiceId = invoice.id;
    }
    await this.returnNoteService.updateStatus(
      id,
      RETURN_NOTE_STATUS.Invoiced,
      userId,
    );
    return this.returnNoteService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'invoices',
      },
      userId,
    );
  }

  @Post('/from-delivery-note/:id')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.CREATE)
  async saveFromDeliveryNote(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ) {
    const deliveryNote = await this.deliveryNoteService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'articleDeliveryNoteEntries,articleDeliveryNoteEntries.article,articleDeliveryNoteEntries.articleDeliveryNoteEntryTaxes',
      },
      this.getAuthenticatedUserId(req),
    );
    return this.returnNoteService.saveFromDeliveryNote(deliveryNote);
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
        join: 'articleGoodsIssueNoteEntries,articleGoodsIssueNoteEntries.article,articleGoodsIssueNoteEntries.articleGoodsIssueNoteEntryTaxes',
      },
      this.getAuthenticatedUserId(req),
    );
    return this.returnNoteService.saveFromGoodsIssueNote(goodsIssueNote);
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
    return this.returnNoteService.saveFromInvoice(invoice);
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/:id')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.UPDATE)
  @LogEvent(EVENT_TYPE.SELLING_RETURN_NOTE_UPDATED)
  async update(
    @Param('id') id: number,
    @Body() updateReturnNoteDto: UpdateReturnNoteDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseReturnNoteDto> {
    req.logInfo = { id };
    return this.returnNoteService.update(
      id,
      updateReturnNoteDto,
      this.getAuthenticatedUserId(req),
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Delete('/:id')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.DELETE)
  @LogEvent(EVENT_TYPE.SELLING_RETURN_NOTE_DELETED)
  async delete(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseReturnNoteDto> {
    req.logInfo = { id };
    return this.returnNoteService.softDelete(
      id,
      this.getAuthenticatedUserId(req),
    );
  }
}
