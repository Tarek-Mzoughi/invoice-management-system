import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseInterceptors,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiParam } from '@nestjs/swagger';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { ApiPaginatedResponse } from 'src/shared/database/decorators/api-paginated-resposne.decorator';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { LogEvent } from 'src/shared/logger/decorators/log-event.decorator';
import { LogInterceptor } from 'src/shared/logger/decorators/logger.interceptor';
import { EVENT_TYPE } from 'src/shared/logger/enums/event-type.enum';
import { AdvancedRequest } from 'src/types';
import { CreateTreasuryMovementDto } from '../dtos/treasury-movement.create.dto';
import { ResponseTreasuryMovementDto } from '../dtos/treasury-movement.response.dto';
import { TreasuryMovementService } from '../services/treasury-movement.service';
import { RequirePermissions } from 'src/shared/auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';

@ApiTags('treasury-movement')
@Controller({ version: '1', path: '/treasury-movement' })
@UseInterceptors(LogInterceptor)
@RequirePermissions(
  PERMISSIONS.TREASURY.READ,
  "Vous n'avez pas l'autorisation de consulter la trésorerie.",
)
export class TreasuryMovementController {
  constructor(
    private readonly treasuryMovementService: TreasuryMovementService,
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
  ): Promise<ResponseTreasuryMovementDto[]> {
    return await this.treasuryMovementService.findAll(
      options,
      this.getAuthenticatedUserId(req),
    );
  }

  @Get('/list')
  @ApiPaginatedResponse(ResponseTreasuryMovementDto)
  async findAllPaginated(
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<PageDto<ResponseTreasuryMovementDto>> {
    return await this.treasuryMovementService.findAllPaginated(
      query,
      this.getAuthenticatedUserId(req),
    );
  }

  @Get('/:id')
  @ApiParam({ name: 'id', type: 'number', required: true })
  async findOneById(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseTreasuryMovementDto> {
    return await this.treasuryMovementService.findOneById(
      id,
      this.getAuthenticatedUserId(req),
    );
  }

  @Post('')
  @RequirePermissions(
    PERMISSIONS.TREASURY.CREATE,
    "Vous n'avez pas l'autorisation de créer cette ressource.",
  )
  @LogEvent(EVENT_TYPE.TREASURY_MOVEMENT_CREATED)
  async save(
    @Body() createTreasuryMovementDto: CreateTreasuryMovementDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseTreasuryMovementDto> {
    const movement = await this.treasuryMovementService.save(
      createTreasuryMovementDto,
      this.getAuthenticatedUserId(req),
    );
    req.logInfo = { id: movement.id, accountId: movement.accountId };
    return movement;
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Delete('/:id')
  @RequirePermissions(
    PERMISSIONS.TREASURY.DELETE,
    "Vous n'avez pas l'autorisation de supprimer cette ressource.",
  )
  @LogEvent(EVENT_TYPE.TREASURY_MOVEMENT_DELETED)
  async delete(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseTreasuryMovementDto> {
    req.logInfo = { id };
    return await this.treasuryMovementService.softDelete(
      id,
      this.getAuthenticatedUserId(req),
    );
  }
}
