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
import { QuotationService } from '../services/quotation.service';
import { ResponseQuotationDto } from '../dtos/quotation.response.dto';
import { CreateQuotationDto } from '../dtos/quotation.create.dto';
import { UpdateQuotationDto } from '../dtos/quotation.update.dto';
import { UpdateQuotationSequenceDto } from '../dtos/quotation-seqence.update.dto';
import { DuplicateQuotationDto } from '../dtos/quotation.duplicate.dto';
import { SendQuotationEmailDto } from '../dtos/quotation-send-email.dto';
import { QuotationSequence } from '../interfaces/quotation-sequence.interface';
import { QUOTATION_STATUS } from '../enums/quotation-status.enum';
import { InvoiceService } from 'src/modules/invoice/services/invoice.service';
import { LogInterceptor } from 'src/shared/logger/decorators/logger.interceptor';
import { LogEvent } from 'src/shared/logger/decorators/log-event.decorator';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { ApiPaginatedResponse } from 'src/shared/database/decorators/api-paginated-resposne.decorator';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { EVENT_TYPE } from 'src/shared/logger/enums/event-type.enum';
import { AdvancedRequest } from 'src/types';
import { QuotationNotFoundException } from '../errors/quotation.notfound.error';
import {
  RequireAnyPermissions,
  RequirePermissions,
} from 'src/shared/auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';

@ApiTags('quotation')
@Controller({ version: '1', path: '/quotation' })
@UseInterceptors(LogInterceptor)
@RequirePermissions(
  PERMISSIONS.SELLING_DOCUMENTS.READ,
  "Vous n'avez pas l'autorisation de consulter cette ressource.",
)
export class QuotationController {
  constructor(
    private readonly quotationService: QuotationService,
    private readonly invoiceService: InvoiceService,
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
  ): Promise<ResponseQuotationDto[]> {
    return this.quotationService.findAll(
      options,
      this.getAuthenticatedUserId(req),
    );
  }

  @Get('/list')
  @ApiPaginatedResponse(ResponseQuotationDto)
  async findAllPaginated(
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<PageDto<ResponseQuotationDto>> {
    return this.quotationService.findAllPaginated(
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
  ): Promise<ResponseQuotationDto> {
    const quotation = await this.quotationService.findOneByCondition(
      { ...query, filter: `id||$eq||${id}` },
      this.getAuthenticatedUserId(req),
    );
    if (!quotation) {
      throw new QuotationNotFoundException();
    }
    return quotation;
  }

  @Get('/:id/download')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="quotation.pdf"')
  @LogEvent(EVENT_TYPE.SELLING_QUOTATION_PRINTED)
  async generatePdf(
    @Param('id') id: number,
    @Query() query: { template: string },
    @Request() req: AdvancedRequest,
  ) {
    req.logInfo = { id };
    return this.quotationService.downloadPdf(
      id,
      query.template,
      this.getAuthenticatedUserId(req),
    );
  }

  @Post('')
  @RequirePermissions(
    PERMISSIONS.SELLING_DOCUMENTS.CREATE,
    "Vous n'avez pas l'autorisation de créer cette ressource.",
  )
  @LogEvent(EVENT_TYPE.SELLING_QUOTATION_CREATED)
  async save(
    @Body() createQuotationDto: CreateQuotationDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseQuotationDto> {
    const quotation = await this.quotationService.save(
      createQuotationDto,
      this.getAuthenticatedUserId(req),
    );
    req.logInfo = { id: quotation.id };
    return quotation;
  }

  @Post('/duplicate')
  @RequirePermissions(
    PERMISSIONS.SELLING_DOCUMENTS.CREATE,
    "Vous n'avez pas l'autorisation de créer cette ressource.",
  )
  @LogEvent(EVENT_TYPE.SELLING_QUOTATION_DUPLICATED)
  async duplicate(
    @Body() duplicateQuotationDto: DuplicateQuotationDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseQuotationDto> {
    const quotation = await this.quotationService.duplicate(
      duplicateQuotationDto,
      this.getAuthenticatedUserId(req),
    );
    req.logInfo = { id: duplicateQuotationDto.id, duplicateId: quotation.id };
    return quotation;
  }

  @Post('/:id/send-email')
  @RequireAnyPermissions(
    [PERMISSIONS.SELLING_DOCUMENTS.READ, PERMISSIONS.SELLING_DOCUMENTS.UPDATE],
    "Vous n'avez pas l'autorisation d'envoyer ce devis.",
  )
  @ApiParam({ name: 'id', type: 'number', required: true })
  async sendEmail(
    @Param('id') id: number,
    @Body() body: SendQuotationEmailDto,
    @Request() req: AdvancedRequest,
  ): Promise<{ success: boolean }> {
    return this.quotationService.sendEmail(
      id,
      body,
      this.getAuthenticatedUserId(req),
    );
  }

  @Put('/update-quotation-sequences')
  @RequirePermissions(
    PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
    "Vous n'avez pas l'autorisation de modifier cette ressource.",
  )
  @ApiParam({ name: 'id', type: 'number', required: true })
  async updateQuotationSequences(
    @Body() updatedSequenceDto: UpdateQuotationSequenceDto,
  ): Promise<QuotationSequence> {
    return this.quotationService.updateQuotationSequence(updatedSequenceDto);
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @ApiParam({ name: 'create', type: 'boolean', required: false })
  @Put('/invoice/:id/:create')
  @RequirePermissions(
    PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
    "Vous n'avez pas l'autorisation de modifier cette ressource.",
  )
  @LogEvent(EVENT_TYPE.SELLING_QUOTATION_INVOICED)
  async invoice(
    @Param('id') id: number,
    @Param('create') create: boolean,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseQuotationDto> {
    req.logInfo = { quotationId: id, invoiceId: null };
    const quotation = await this.quotationService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join:
          'quotationMetaData,' +
          'articleQuotationEntries,' +
          `articleQuotationEntries.article,` +
          `articleQuotationEntries.articleQuotationEntryTaxes,` +
          `articleQuotationEntries.articleQuotationEntryTaxes.tax`,
      },
      this.getAuthenticatedUserId(req),
    );
    if (quotation.status === QUOTATION_STATUS.Accepted || create) {
      const invoice = await this.invoiceService.saveFromQuotation(quotation);
      req.logInfo.invoiceId = invoice.id;
    }
    await this.quotationService.updateStatus(
      id,
      QUOTATION_STATUS.Accepted,
      this.getAuthenticatedUserId(req),
    );
    return this.quotationService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
        join: 'invoices',
      },
      this.getAuthenticatedUserId(req),
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/:id/status')
  @RequirePermissions(
    PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
    "Vous n'avez pas l'autorisation de modifier cette ressource.",
  )
  @LogEvent(EVENT_TYPE.SELLING_QUOTATION_UPDATED)
  async updateStatus(
    @Param('id') id: number,
    @Body('status') status: QUOTATION_STATUS,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseQuotationDto> {
    req.logInfo = { id };
    await this.quotationService.updateStatus(
      id,
      status,
      this.getAuthenticatedUserId(req),
    );
    return this.quotationService.findOneByCondition(
      {
        filter: `id||$eq||${id}`,
      },
      this.getAuthenticatedUserId(req),
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/:id')
  @RequirePermissions(
    PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
    "Vous n'avez pas l'autorisation de modifier cette ressource.",
  )
  @LogEvent(EVENT_TYPE.SELLING_QUOTATION_UPDATED)
  async update(
    @Param('id') id: number,
    @Body() updateQuotationDto: UpdateQuotationDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseQuotationDto> {
    req.logInfo = { id };
    return this.quotationService.update(
      id,
      updateQuotationDto,
      this.getAuthenticatedUserId(req),
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Delete('/:id')
  @RequirePermissions(
    PERMISSIONS.SELLING_DOCUMENTS.DELETE,
    "Vous n'avez pas l'autorisation de supprimer cette ressource.",
  )
  @LogEvent(EVENT_TYPE.SELLING_QUOTATION_DELETED)
  async delete(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseQuotationDto> {
    req.logInfo = { id };
    return this.quotationService.softDelete(
      id,
      this.getAuthenticatedUserId(req),
    );
  }
}
