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
import { GoodsIssueNoteService } from '../services/goods-issue-note.service';
import { ResponseGoodsIssueNoteDto } from '../dtos/goods-issue-note.response.dto';
import { CreateGoodsIssueNoteDto } from '../dtos/goods-issue-note.create.dto';
import { UpdateGoodsIssueNoteDto } from '../dtos/goods-issue-note.update.dto';
import { UpdateGoodsIssueNoteSequenceDto } from '../dtos/goods-issue-note-seqence.update.dto';
import { DuplicateGoodsIssueNoteDto } from '../dtos/goods-issue-note.duplicate.dto';
import { GoodsIssueNoteSequence } from '../interfaces/goods-issue-note-sequence.interface';
import { GOODS_ISSUE_NOTE_STATUS } from '../enums/goods-issue-note-status.enum';
import { InvoiceService } from 'src/modules/invoice/services/invoice.service';
import { LogInterceptor } from 'src/shared/logger/decorators/logger.interceptor';
import { LogEvent } from 'src/shared/logger/decorators/log-event.decorator';
import { QuotationService } from 'src/modules/quotation/services/quotation.service';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { ApiPaginatedResponse } from 'src/shared/database/decorators/api-paginated-resposne.decorator';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { EVENT_TYPE } from 'src/shared/logger/enums/event-type.enum';
import { AdvancedRequest } from 'src/types';
import { GoodsIssueNoteNotFoundException } from '../errors/goods-issue-note.notfound.error';
import {
  RequireAnyPermissions,
  RequirePermissions,
} from 'src/shared/auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';
import { SendDocumentEmailDto } from 'src/shared/mail/dtos/send-document-email.dto';

@ApiTags('goodsIssueNote')
@Controller({ version: '1', path: '/goodsIssueNote' })
@UseInterceptors(LogInterceptor)
@RequirePermissions(
  PERMISSIONS.SELLING_DOCUMENTS.READ,
  "Vous n'avez pas l'autorisation de consulter cette ressource.",
)
export class GoodsIssueNoteController {
  constructor(
    private readonly goodsIssueNoteService: GoodsIssueNoteService,
    private readonly invoiceService: InvoiceService,
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
  ): Promise<ResponseGoodsIssueNoteDto[]> {
    return this.goodsIssueNoteService.findAll(
      options,
      this.getAuthenticatedUserId(req),
    );
  }

  @Get('/list')
  @ApiPaginatedResponse(ResponseGoodsIssueNoteDto)
  async findAllPaginated(
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<PageDto<ResponseGoodsIssueNoteDto>> {
    return this.goodsIssueNoteService.findAllPaginated(
      query,
      this.getAuthenticatedUserId(req),
    );
  }

  @Get('/:id')
  @RequireAnyPermissions(
    [PERMISSIONS.SELLING_DOCUMENTS.READ, PERMISSIONS.SELLING_DOCUMENTS.UPDATE],
    "Vous n'avez pas l'autorisation de consulter cette ressource.",
  )
  @ApiParam({ name: 'id', type: 'number', required: true })
  async findOneById(
    @Param('id') id: number,
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseGoodsIssueNoteDto> {
    const goodsIssueNote = await this.goodsIssueNoteService.findOneByCondition(
      {
        ...query,
        filter: query.filter
          ? `${query.filter};id||$eq||${id}`
          : `id||$eq||${id}`,
      },
      this.getAuthenticatedUserId(req),
    );
    if (!goodsIssueNote) {
      throw new GoodsIssueNoteNotFoundException();
    }
    return goodsIssueNote;
  }

  @Get('/:id/download')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="goodsIssueNote.pdf"')
  @LogEvent(EVENT_TYPE.SELLING_GOODS_ISSUE_NOTE_PRINTED)
  async generatePdf(
    @Param('id') id: number,
    @Query() query: { template: string },
    @Request() req: AdvancedRequest,
  ) {
    req.logInfo = { id };
    return this.goodsIssueNoteService.downloadPdf(
      id,
      query.template,
      this.getAuthenticatedUserId(req),
    );
  }

  @Post('/:id/send-email')
  @RequireAnyPermissions(
    [PERMISSIONS.SELLING_DOCUMENTS.READ, PERMISSIONS.SELLING_DOCUMENTS.UPDATE],
    "Vous n'avez pas l'autorisation d'envoyer ce document.",
  )
  @ApiParam({ name: 'id', type: 'number', required: true })
  async sendEmail(
    @Param('id') id: number,
    @Body() body: SendDocumentEmailDto,
    @Request() req: AdvancedRequest,
  ): Promise<{ success: boolean }> {
    return this.goodsIssueNoteService.sendEmail(
      id,
      body,
      this.getAuthenticatedUserId(req),
    );
  }

  @Post('')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.CREATE)
  @LogEvent(EVENT_TYPE.SELLING_GOODS_ISSUE_NOTE_CREATED)
  async save(
    @Body() createGoodsIssueNoteDto: CreateGoodsIssueNoteDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseGoodsIssueNoteDto> {
    const goodsIssueNote = await this.goodsIssueNoteService.save(
      createGoodsIssueNoteDto,
      this.getAuthenticatedUserId(req),
    );
    req.logInfo = { id: goodsIssueNote.id };
    return goodsIssueNote;
  }

  @Post('/duplicate')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.CREATE)
  @LogEvent(EVENT_TYPE.SELLING_GOODS_ISSUE_NOTE_DUPLICATED)
  async duplicate(
    @Body() duplicateGoodsIssueNoteDto: DuplicateGoodsIssueNoteDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseGoodsIssueNoteDto> {
    const goodsIssueNote = await this.goodsIssueNoteService.duplicate(
      duplicateGoodsIssueNoteDto,
      this.getAuthenticatedUserId(req),
    );
    req.logInfo = {
      id: duplicateGoodsIssueNoteDto.id,
      duplicateId: goodsIssueNote.id,
    };
    return goodsIssueNote;
  }

  @Put('/update-goods-issue-note-sequences')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.UPDATE)
  @ApiParam({ name: 'id', type: 'number', required: true })
  async updateGoodsIssueNoteSequences(
    @Body() updatedSequenceDto: UpdateGoodsIssueNoteSequenceDto,
  ): Promise<GoodsIssueNoteSequence> {
    return this.goodsIssueNoteService.updateGoodsIssueNoteSequence(
      updatedSequenceDto,
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @ApiParam({ name: 'create', type: 'boolean', required: false })
  @Put('/invoice/:id/:create')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.UPDATE)
  @LogEvent(EVENT_TYPE.SELLING_GOODS_ISSUE_NOTE_INVOICED)
  async invoice(
    @Param('id') id: number,
    @Param('create') create: boolean,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseGoodsIssueNoteDto> {
    const userId = this.getAuthenticatedUserId(req);
    req.logInfo = { goodsIssueNoteId: id, invoiceId: null };
    const goodsIssueNote = await this.goodsIssueNoteService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join:
          'goodsIssueNoteMetaData,' +
          'articleGoodsIssueNoteEntries,' +
          `articleGoodsIssueNoteEntries.article,` +
          `articleGoodsIssueNoteEntries.articleGoodsIssueNoteEntryTaxes,` +
          `articleGoodsIssueNoteEntries.articleGoodsIssueNoteEntryTaxes.tax`,
      },
      userId,
    );
    if (goodsIssueNote.status === GOODS_ISSUE_NOTE_STATUS.Invoiced || create) {
      const invoice =
        await this.invoiceService.saveFromGoodsIssueNote(goodsIssueNote);
      req.logInfo.invoiceId = invoice.id;
    }
    await this.goodsIssueNoteService.updateStatus(
      id,
      GOODS_ISSUE_NOTE_STATUS.Invoiced,
      userId,
    );
    return this.goodsIssueNoteService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'invoices',
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
    return this.goodsIssueNoteService.saveFromQuotation(quotation);
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
    return this.goodsIssueNoteService.saveFromInvoice(invoice);
  }

  @Post('/from-customer-order/:id')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.CREATE)
  async saveFromCustomerOrder() {
    throw new BadRequestException(
      'customerOrder.errors.goods_issue_note_not_supported',
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/:id')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.UPDATE)
  @LogEvent(EVENT_TYPE.SELLING_GOODS_ISSUE_NOTE_UPDATED)
  async update(
    @Param('id') id: number,
    @Body() updateGoodsIssueNoteDto: UpdateGoodsIssueNoteDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseGoodsIssueNoteDto> {
    req.logInfo = { id };
    return this.goodsIssueNoteService.update(
      id,
      updateGoodsIssueNoteDto,
      this.getAuthenticatedUserId(req),
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Delete('/:id')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.DELETE)
  @LogEvent(EVENT_TYPE.SELLING_GOODS_ISSUE_NOTE_DELETED)
  async delete(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseGoodsIssueNoteDto> {
    req.logInfo = { id };
    return this.goodsIssueNoteService.softDelete(
      id,
      this.getAuthenticatedUserId(req),
    );
  }
}
