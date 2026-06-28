import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Put,
  UseInterceptors,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { FirmService } from '../services/firm.service';
import { ResponseFirmDto } from '../dtos/firm.response.dto';
import { CreateFirmDto } from '../dtos/firm.create.dto';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { UpdateFirmDto } from '../dtos/firm.update.dto';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { LogInterceptor } from 'src/shared/logger/decorators/logger.interceptor';
import { LogEvent } from 'src/shared/logger/decorators/log-event.decorator';
import { ApiPaginatedResponse } from 'src/shared/database/decorators/api-paginated-resposne.decorator';
import { AdvancedRequest } from 'src/types';
import { EVENT_TYPE } from 'src/shared/logger/enums/event-type.enum';
import { FirmNotFoundException } from '../errors/firm.notfound.error';
import { RequireAnyPermissions } from 'src/shared/auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';
import { FIRM_ENTITY_TYPE } from '../enums/firm-entity-type.enum';
import { ResponseFirmDocumentChoiceDto } from '../dtos/firm-document-choice.response.dto';

@ApiTags('firm')
@Controller({ version: '1', path: '/firm' })
@UseInterceptors(LogInterceptor)
@RequireAnyPermissions(
  [PERMISSIONS.CLIENTS.READ, PERMISSIONS.SUPPLIERS.READ],
  "Vous n'avez pas l'autorisation de consulter cette ressource.",
)
export class FirmController {
  constructor(private readonly firmService: FirmService) {}

  private getAuthenticatedUserId(req: AdvancedRequest): string {
    if (!req.user?.sub) {
      throw new ForbiddenException('Authenticated user is required');
    }
    return req.user.sub;
  }

  @Get('/document-choices')
  @RequireAnyPermissions(
    [
      PERMISSIONS.CLIENTS.READ,
      PERMISSIONS.SUPPLIERS.READ,
      PERMISSIONS.SELLING_DOCUMENTS.CREATE,
      PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
      PERMISSIONS.BUYING_DOCUMENTS.CREATE,
      PERMISSIONS.BUYING_DOCUMENTS.UPDATE,
    ],
    "Vous n'avez pas l'autorisation de consulter cette ressource.",
  )
  async findDocumentChoices(
    @Query('entityType') entityType: FIRM_ENTITY_TYPE,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseFirmDocumentChoiceDto[]> {
    if (
      ![FIRM_ENTITY_TYPE.CLIENTS, FIRM_ENTITY_TYPE.SUPPLIERS].includes(
        entityType,
      )
    ) {
      throw new BadRequestException(
        'Invalid firm document choice entity type.',
      );
    }

    const firms = await this.firmService.findAll(
      {
        join: 'currency,paymentCondition,invoicingAddress,invoicingAddress.country,deliveryAddress,deliveryAddress.country,interlocutorsToFirm,interlocutorsToFirm.interlocutor',
        filter: `entityType||$eq||${entityType}`,
      },
      this.getAuthenticatedUserId(req),
    );

    return firms.map((firm) => ({
      id: firm.id,
      name: firm.name,
      label: firm.name,
      currency: firm.currency,
      currencyId: firm.currencyId,
      paymentCondition: firm.paymentCondition,
      paymentConditionId: firm.paymentConditionId,
      invoicingAddress: firm.invoicingAddress,
      invoicingAddressId: firm.invoicingAddressId,
      deliveryAddress: firm.deliveryAddress,
      deliveryAddressId: firm.deliveryAddressId,
      interlocutorsToFirm: firm.interlocutorsToFirm,
    }));
  }

  @Get('/all')
  async findAll(
    @Query() options: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseFirmDto[]> {
    return await this.firmService.findAll(
      options,
      this.getAuthenticatedUserId(req),
    );
  }

  @Get('/list')
  @ApiPaginatedResponse(ResponseFirmDto)
  async findAllPaginated(
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<PageDto<ResponseFirmDto>> {
    return await this.firmService.findAllPaginated(
      query,
      this.getAuthenticatedUserId(req),
    );
  }

  @Get('/:id')
  @ApiParam({ name: 'id', type: 'number', required: true })
  async findOneById(
    @Param('id') id: number,
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseFirmDto> {
    const firm = await this.firmService.findOneByCondition(
      {
        ...query,
        filter: `id||$eq||${id}`,
      },
      this.getAuthenticatedUserId(req),
    );
    if (!firm) {
      throw new FirmNotFoundException();
    }
    return firm;
  }

  @Post('')
  @RequireAnyPermissions(
    [PERMISSIONS.CLIENTS.CREATE, PERMISSIONS.SUPPLIERS.CREATE],
    "Vous n'avez pas l'autorisation de créer cette ressource.",
  )
  @LogEvent(EVENT_TYPE.FIRM_CREATED)
  async save(
    @Body() createFirmDto: CreateFirmDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseFirmDto> {
    const firm = await this.firmService.save(
      createFirmDto,
      this.getAuthenticatedUserId(req),
    );
    req.logInfo = { id: firm.id };
    return firm;
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/:id')
  @RequireAnyPermissions(
    [PERMISSIONS.CLIENTS.UPDATE, PERMISSIONS.SUPPLIERS.UPDATE],
    "Vous n'avez pas l'autorisation de modifier cette ressource.",
  )
  @LogEvent(EVENT_TYPE.FIRM_UPDATED)
  async update(
    @Param('id') id: number,
    @Body() updateActivityDto: UpdateFirmDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseFirmDto> {
    req.logInfo = { id };
    return await this.firmService.update(
      id,
      updateActivityDto,
      this.getAuthenticatedUserId(req),
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Delete('/:id')
  @RequireAnyPermissions(
    [PERMISSIONS.CLIENTS.DELETE, PERMISSIONS.SUPPLIERS.DELETE],
    "Vous n'avez pas l'autorisation de supprimer cette ressource.",
  )
  @LogEvent(EVENT_TYPE.FIRM_DELETED)
  async delete(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseFirmDto> {
    req.logInfo = { id };
    return await this.firmService.softDelete(
      id,
      this.getAuthenticatedUserId(req),
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/:id/activate')
  @RequireAnyPermissions(
    [PERMISSIONS.CLIENTS.UPDATE, PERMISSIONS.SUPPLIERS.UPDATE],
    "Vous n'avez pas l'autorisation de modifier cette ressource.",
  )
  @LogEvent(EVENT_TYPE.FIRM_UPDATED)
  async activate(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseFirmDto> {
    req.logInfo = { id };
    return await this.firmService.setActive(
      id,
      true,
      this.getAuthenticatedUserId(req),
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/:id/deactivate')
  @RequireAnyPermissions(
    [PERMISSIONS.CLIENTS.UPDATE, PERMISSIONS.SUPPLIERS.UPDATE],
    "Vous n'avez pas l'autorisation de modifier cette ressource.",
  )
  @LogEvent(EVENT_TYPE.FIRM_UPDATED)
  async deactivate(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseFirmDto> {
    req.logInfo = { id };
    return await this.firmService.setActive(
      id,
      false,
      this.getAuthenticatedUserId(req),
    );
  }
}
