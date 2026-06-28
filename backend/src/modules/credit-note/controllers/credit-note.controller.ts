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
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { CreditNoteService } from '../services/credit-note.service';
import { ResponseCreditNoteDto } from '../dtos/credit-note.response.dto';
import { CreateCreditNoteDto } from '../dtos/credit-note.create.dto';
import { DuplicateCreditNoteDto } from '../dtos/credit-note.duplicate.dto';
import { CreditNoteSequence } from '../interfaces/credit-note-sequence.interface';
import { UpdateCreditNoteSequenceDto } from '../dtos/credit-note-seqence.update.dto';
import { UpdateCreditNoteDto } from '../dtos/credit-note.update.dto';
import { ResponseCreditNoteRangeDto } from '../dtos/credit-note-range.response.dto';
import { LogInterceptor } from 'src/shared/logger/decorators/logger.interceptor';
import { LogEvent } from 'src/shared/logger/decorators/log-event.decorator';
import { InvoiceService } from 'src/modules/invoice/services/invoice.service';
import { ReturnNoteService } from 'src/modules/return-note/services/return-note.service';
import { ApiPaginatedResponse } from 'src/shared/database/decorators/api-paginated-resposne.decorator';
import { EVENT_TYPE } from 'src/shared/logger/enums/event-type.enum';
import { AdvancedRequest } from 'src/types';
import { CreditNoteNotFoundException } from '../errors/credit-note.notfound.error';
import {
  RequireAnyPermissions,
  RequirePermissions,
} from 'src/shared/auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';
import { canAccessDocumentByActivityType } from 'src/modules/user-management/rbac/contextual-lookup-permissions';
import { SendDocumentEmailDto } from 'src/shared/mail/dtos/send-document-email.dto';

@ApiTags('creditNote')
@Controller({ version: '1', path: '/creditNote' })
@UseInterceptors(LogInterceptor)
@RequirePermissions(
  PERMISSIONS.SELLING_DOCUMENTS.READ,
  "Vous n'avez pas l'autorisation de consulter cette ressource.",
)
export class CreditNoteController {
  constructor(
    private readonly creditNoteService: CreditNoteService,
    private readonly invoiceService: InvoiceService,
    private readonly returnNoteService: ReturnNoteService,
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
  ): Promise<ResponseCreditNoteDto[]> {
    return this.creditNoteService.findAll(
      options,
      this.getAuthenticatedUserId(req),
    );
  }

  @Get('/list')
  @ApiPaginatedResponse(ResponseCreditNoteDto)
  async findAllPaginated(
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<PageDto<ResponseCreditNoteDto>> {
    return this.creditNoteService.findAllPaginated(
      query,
      this.getAuthenticatedUserId(req),
    );
  }

  @Get('/sequential-range/:id')
  async findCreditNotesByRange(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseCreditNoteRangeDto> {
    return this.creditNoteService.findCreditNotesByRange(
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
    "Vous n'avez pas l'autorisation de consulter cette ressource.",
  )
  @ApiParam({ name: 'id', type: 'number', required: true })
  async findOneById(
    @Param('id') id: number,
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseCreditNoteDto> {
    const creditNote = await this.creditNoteService.findOneByCondition(
      {
        ...query,
        filter: query.filter
          ? `${query.filter};id||$eq||${id}`
          : `id||$eq||${id}`,
      },
      this.getAuthenticatedUserId(req),
    );
    if (!creditNote) {
      throw new CreditNoteNotFoundException();
    }
    if (
      !canAccessDocumentByActivityType(
        creditNote.activityType,
        (req as AdvancedRequest & { effectivePermissionIds?: string[] })
          .effectivePermissionIds || [],
      )
    ) {
      throw new ForbiddenException(
        "Vous n'avez pas l'autorisation de consulter cette ressource.",
      );
    }
    return creditNote;
  }

  @Get('/:id/download')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="creditNote.pdf"')
  @LogEvent(EVENT_TYPE.SELLING_CREDIT_NOTE_PRINTED)
  async generatePdf(
    @Param('id') id: number,
    @Query() query: { template: string },
    @Request() req: AdvancedRequest,
  ) {
    req.logInfo = { id };
    return this.creditNoteService.downloadPdf(
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
    return this.creditNoteService.sendEmail(
      id,
      body,
      this.getAuthenticatedUserId(req),
    );
  }

  @Post('')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.CREATE)
  @LogEvent(EVENT_TYPE.SELLING_CREDIT_NOTE_CREATED)
  async save(
    @Body() createCreditNoteDto: CreateCreditNoteDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseCreditNoteDto> {
    const creditNote = await this.creditNoteService.save(
      createCreditNoteDto,
      this.getAuthenticatedUserId(req),
    );
    req.logInfo = { id: creditNote.id };
    return creditNote;
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
    return this.creditNoteService.saveFromInvoice(invoice);
  }

  @Post('/from-return-note/:id')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.CREATE)
  async saveFromReturnNote(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ) {
    const returnNote = await this.returnNoteService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'articleReturnNoteEntries,articleReturnNoteEntries.article,articleReturnNoteEntries.articleReturnNoteEntryTaxes',
      },
      this.getAuthenticatedUserId(req),
    );
    return this.creditNoteService.saveFromReturnNote(returnNote);
  }

  @Post('/duplicate')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.CREATE)
  @LogEvent(EVENT_TYPE.SELLING_CREDIT_NOTE_DUPLICATED)
  async duplicate(
    @Body() duplicateCreditNoteDto: DuplicateCreditNoteDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseCreditNoteDto> {
    const creditNote = await this.creditNoteService.duplicate(
      duplicateCreditNoteDto,
      this.getAuthenticatedUserId(req),
    );
    req.logInfo = { id: duplicateCreditNoteDto.id, duplicateId: creditNote.id };
    return creditNote;
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/update-credit-note-sequences')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.UPDATE)
  async updateCreditNoteSequences(
    @Body() updatedSequenceDto: UpdateCreditNoteSequenceDto,
  ): Promise<CreditNoteSequence> {
    return this.creditNoteService.updateCreditNoteSequence(updatedSequenceDto);
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/:id')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.UPDATE)
  @LogEvent(EVENT_TYPE.SELLING_CREDIT_NOTE_UPDATED)
  async update(
    @Param('id') id: number,
    @Body() updateCreditNoteDto: UpdateCreditNoteDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseCreditNoteDto> {
    req.logInfo = { id };
    return this.creditNoteService.update(
      id,
      updateCreditNoteDto,
      this.getAuthenticatedUserId(req),
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Delete('/:id')
  @RequirePermissions(PERMISSIONS.SELLING_DOCUMENTS.DELETE)
  @LogEvent(EVENT_TYPE.SELLING_CREDIT_NOTE_DELETED)
  async delete(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseCreditNoteDto> {
    req.logInfo = { id };
    return this.creditNoteService.softDelete(
      id,
      this.getAuthenticatedUserId(req),
    );
  }
}
