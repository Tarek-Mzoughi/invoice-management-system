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
import { BankAccountService } from '../services/bank-account.service';
import { ResponseBankAccountDto } from '../dtos/bank-account.response.dto';
import { CreateBankAccountDto } from '../dtos/bank-account.create.dto';
import { UpdateBankAccountDto } from '../dtos/bank-account.update.dto';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { LogInterceptor } from 'src/shared/logger/decorators/logger.interceptor';
import { LogEvent } from 'src/shared/logger/decorators/log-event.decorator';
import { ApiPaginatedResponse } from 'src/shared/database/decorators/api-paginated-resposne.decorator';
import { AdvancedRequest } from 'src/types';
import { EVENT_TYPE } from 'src/shared/logger/enums/event-type.enum';
import { BankAccountNotFoundException } from '../errors/bank-account.notfound.error';
import { RequirePermissions } from 'src/shared/auth/decorators/require-permissions.decorator';
import { PERMISSIONS } from 'src/modules/user-management/rbac/permission.constants';

@ApiTags('bank-account')
@Controller({ version: '1', path: '/bank-account' })
@UseInterceptors(LogInterceptor)
@RequirePermissions(
  PERMISSIONS.TREASURY.READ,
  "Vous n'avez pas l'autorisation de consulter la trésorerie.",
)
export class BankAccountController {
  constructor(private readonly bankAccountService: BankAccountService) {}

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
  ): Promise<ResponseBankAccountDto[]> {
    return await this.bankAccountService.findAll(
      options,
      this.getAuthenticatedUserId(req),
    );
  }

  @Get('/list')
  @ApiPaginatedResponse(ResponseBankAccountDto)
  async findAllPaginated(
    @Query() query: IQueryObject,
    @Request() req: AdvancedRequest,
  ): Promise<PageDto<ResponseBankAccountDto>> {
    return await this.bankAccountService.findAllPaginated(
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
  ): Promise<ResponseBankAccountDto> {
    const account = await this.bankAccountService.findOneByCondition(
      { ...query, filter: `id||$eq||${id}` },
      this.getAuthenticatedUserId(req),
    );
    if (!account) {
      throw new BankAccountNotFoundException();
    }
    return account;
  }

  @Post('')
  @RequirePermissions(
    PERMISSIONS.TREASURY.CREATE,
    "Vous n'avez pas l'autorisation de créer cette ressource.",
  )
  @LogEvent(EVENT_TYPE.BANK_ACCOUNT_CREATED)
  async save(
    @Body() createBankAccountDto: CreateBankAccountDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseBankAccountDto> {
    const bank = await this.bankAccountService.save(
      createBankAccountDto,
      this.getAuthenticatedUserId(req),
    );
    req.logInfo = { id: bank.id };
    return bank;
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Put('/:id')
  @RequirePermissions(
    PERMISSIONS.TREASURY.UPDATE,
    "Vous n'avez pas l'autorisation de modifier cette ressource.",
  )
  @LogEvent(EVENT_TYPE.BANK_ACCOUNT_UPDATED)
  async update(
    @Param('id') id: number,
    @Body() updateBankAccountDto: UpdateBankAccountDto,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseBankAccountDto> {
    req.logInfo = { id };
    return await this.bankAccountService.update(
      id,
      updateBankAccountDto,
      this.getAuthenticatedUserId(req),
    );
  }

  @ApiParam({ name: 'id', type: 'number', required: true })
  @Delete('/:id')
  @RequirePermissions(
    PERMISSIONS.TREASURY.DELETE,
    "Vous n'avez pas l'autorisation de supprimer cette ressource.",
  )
  @LogEvent(EVENT_TYPE.BANK_ACCOUNT_DELETED)
  async delete(
    @Param('id') id: number,
    @Request() req: AdvancedRequest,
  ): Promise<ResponseBankAccountDto> {
    req.logInfo = { id };
    return await this.bankAccountService.softDelete(
      id,
      this.getAuthenticatedUserId(req),
    );
  }
}
