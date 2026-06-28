import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';
import { RequirePermissions } from 'src/shared/auth/decorators/require-permissions.decorator';
import { ApiPaginatedResponse } from 'src/shared/database/decorators/api-paginated-resposne.decorator';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { LogEvent } from 'src/shared/logger/decorators/log-event.decorator';
import { LogInterceptor } from 'src/shared/logger/decorators/logger.interceptor';
import { EVENT_TYPE } from 'src/shared/logger/enums/event-type.enum';
import { AdvancedRequest } from 'src/types';
import { CreatePriceListDto } from '../dtos/price-list.create.dto';
import { ResponsePriceListDto } from '../dtos/price-list.response.dto';
import { UpdatePriceListDto } from '../dtos/price-list.update.dto';
import { PriceListService } from '../services/price-list.service';

@ApiTags('price-list')
@Controller({ version: '1', path: '/price-list' })
@UseInterceptors(LogInterceptor)
@RequirePermissions(
  PERMISSIONS.PRICE_LISTS.READ,
  "Vous n'avez pas l'autorisation de consulter les listes de prix.",
)
export class PriceListController {
  constructor(private readonly priceListService: PriceListService) {}

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
  ): Promise<ResponsePriceListDto[]> {
    return this.priceListService.findAll(
      options,
      this.getAuthenticatedUserId(req),
    );
  }

  @Get('/list')
  @ApiPaginatedResponse(ResponsePriceListDto)
  async findAllPaginated(
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<PageDto<ResponsePriceListDto>> {
    return this.priceListService.findAllPaginated(
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
  ): Promise<ResponsePriceListDto> {
    const priceList = await this.priceListService.findOneByCondition(
      { ...query, filter: `id||$eq||${id}` },
      this.getAuthenticatedUserId(req),
    );
    if (!priceList) {
      throw new ForbiddenException('Liste de prix introuvable.');
    }
    return priceList;
  }

  @Post('')
  @RequirePermissions(
    PERMISSIONS.PRICE_LISTS.CREATE,
    "Vous n'avez pas l'autorisation de créer une liste de prix.",
  )
  @LogEvent(EVENT_TYPE.PRICE_LIST_CREATED)
  async save(
    @Body() createPriceListDto: CreatePriceListDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponsePriceListDto> {
    const priceList = await this.priceListService.save(
      createPriceListDto,
      this.getAuthenticatedUserId(req),
    );
    req.logInfo = { id: priceList.id };
    return priceList;
  }

  @Put('/:id')
  @RequirePermissions(
    PERMISSIONS.PRICE_LISTS.UPDATE,
    "Vous n'avez pas l'autorisation de modifier une liste de prix.",
  )
  @LogEvent(EVENT_TYPE.PRICE_LIST_UPDATED)
  @ApiParam({ name: 'id', type: 'number', required: true })
  async update(
    @Param('id') id: number,
    @Body() updatePriceListDto: UpdatePriceListDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponsePriceListDto> {
    req.logInfo = { id };
    return this.priceListService.update(
      id,
      updatePriceListDto,
      this.getAuthenticatedUserId(req),
    );
  }

  @Delete('/:id')
  @RequirePermissions(
    PERMISSIONS.PRICE_LISTS.DELETE,
    "Vous n'avez pas l'autorisation de supprimer une liste de prix.",
  )
  @LogEvent(EVENT_TYPE.PRICE_LIST_DELETED)
  @ApiParam({ name: 'id', type: 'number', required: true })
  async delete(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponsePriceListDto> {
    req.logInfo = { id };
    return this.priceListService.softDelete(
      id,
      this.getAuthenticatedUserId(req),
    );
  }
}
