import { BadRequestException, Injectable } from '@nestjs/common';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { CreateBankAccountDto } from '../dtos/bank-account.create.dto';
import { ResponseBankAccountDto } from '../dtos/bank-account.response.dto';
import { UpdateBankAccountDto } from '../dtos/bank-account.update.dto';
import { BankAccountEntity } from '../entities/bank-account.entity';
import { BankAccountAlreadyExistsException } from '../errors/bank-account.alreadyexists.error';
import { BankAccountCannotBeDeletedException } from '../errors/bank-account.cannotbedeleted.error';
import { BankAccountNotFoundException } from '../errors/bank-account.notfound.error';
import { BANK_ACCOUNT_TYPE } from '../enums/bank-account-type.enum';
import { BankAccountRepository } from '../repositories/bank-account.repository';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { TenantContextService } from 'src/shared/tenant/tenant-context.service';

@Injectable()
export class BankAccountService {
  constructor(
    private readonly bankAccountRepository: BankAccountRepository,
    private readonly tenantContextService: TenantContextService,
  ) {}

  private async scopeQueryForUser(
    query: IQueryObject = {},
    userId?: string,
  ): Promise<IQueryObject> {
    if (!userId) {
      return { ...query };
    }

    const cabinetId =
      await this.tenantContextService.getCurrentCabinetIdOrFail(userId);
    return this.tenantContextService.scopeQueryToCabinet(query, cabinetId);
  }

  private withDefaults(
    bankAccount: Partial<BankAccountEntity>,
  ): Partial<BankAccountEntity> {
    return {
      ...bankAccount,
      type: bankAccount.type ?? BANK_ACCOUNT_TYPE.BANK,
      currencyId:
        bankAccount.currencyId ??
        (bankAccount as { currency?: { id?: number } }).currency?.id,
    };
  }

  private ensureBankAccountPayloadIsValid(
    bankAccount: Partial<BankAccountEntity>,
  ) {
    const payload = this.withDefaults(bankAccount);

    if (!payload.name?.trim() || payload.name.trim().length < 3) {
      throw new BadRequestException(
        'Bank account name must contain at least 3 characters',
      );
    }

    if (!payload.currencyId) {
      throw new BadRequestException('Currency is required');
    }

    if (payload.type === BANK_ACCOUNT_TYPE.BANK) {
      if (!payload.bic?.trim()) {
        throw new BadRequestException('BIC is required for bank accounts');
      }

      if (!payload.rib?.trim()) {
        throw new BadRequestException('RIB is required for bank accounts');
      }

      if (!payload.agency?.trim()) {
        throw new BadRequestException('Agency is required for bank accounts');
      }

      if (!payload.iban?.trim()) {
        throw new BadRequestException('IBAN is required for bank accounts');
      }
    }
  }

  private async attachBalance(
    account: BankAccountEntity | null,
  ): Promise<ResponseBankAccountDto | null> {
    if (!account?.id) return account;

    const balances = await this.bankAccountRepository.getBalances([account.id]);
    return {
      ...account,
      balance: balances[account.id] ?? 0,
    };
  }

  private async attachBalances(
    accounts: BankAccountEntity[],
  ): Promise<ResponseBankAccountDto[]> {
    const ids = accounts
      .map((account) => account.id)
      .filter((accountId): accountId is number => Number(accountId) > 0);
    const balances = await this.bankAccountRepository.getBalances(ids);

    return accounts.map((account) => ({
      ...account,
      balance: account.id ? (balances[account.id] ?? 0) : 0,
    }));
  }

  //return a sorted list of bank accounts
  sortedBankAccounts(bankAccounts: BankAccountEntity[]): BankAccountEntity[] {
    return bankAccounts.sort((a, b) => {
      const aIsMain = a?.isMain ?? false;
      const bIsMain = b?.isMain ?? false;
      return Number(bIsMain) - Number(aIsMain);
    });
  }

  async findOneById(id: number, userId?: string): Promise<BankAccountEntity> {
    const account = userId
      ? await this.findOneByCondition({ filter: `id||$eq||${id}` }, userId)
      : await this.bankAccountRepository.findOneById(id);
    if (!account) {
      throw new BankAccountNotFoundException();
    }
    return account as BankAccountEntity;
  }

  async findOneByIdInCabinet(
    id: number,
    cabinetId: number,
  ): Promise<BankAccountEntity> {
    const account = await this.bankAccountRepository.findOne({
      where: { id, cabinetId },
    });
    if (!account) {
      throw new BankAccountNotFoundException();
    }
    return account;
  }

  async findOneByCondition(
    query: IQueryObject,
    userId?: string,
  ): Promise<ResponseBankAccountDto | null> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const account = await this.bankAccountRepository.findOne(
      queryOptions as FindOneOptions<BankAccountEntity>,
    );
    if (!account) return null;
    return this.attachBalance(account);
  }

  async findAll(
    query: IQueryObject,
    userId?: string,
  ): Promise<ResponseBankAccountDto[]> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const accounts = this.sortedBankAccounts(
      await this.bankAccountRepository.findAll(
        queryOptions as FindManyOptions<BankAccountEntity>,
      ),
    );
    return this.attachBalances(accounts);
  }

  async findAllPaginated(
    query: IQueryObject,
    userId?: string,
  ): Promise<PageDto<ResponseBankAccountDto>> {
    const queryBuilder = new QueryBuilder();
    const scopedQuery = await this.scopeQueryForUser(query, userId);
    const queryOptions = queryBuilder.build(scopedQuery);
    const count = await this.bankAccountRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = await this.attachBalances(
      this.sortedBankAccounts(
        await this.bankAccountRepository.findAll(
          queryOptions as FindManyOptions<BankAccountEntity>,
        ),
      ),
    );

    const pageMetaDto = new PageMetaDto({
      pageOptionsDto: {
        page: parseInt(query.page),
        take: parseInt(query.limit),
      },
      itemCount: count,
    });

    return new PageDto(entities, pageMetaDto);
  }

  async doesBankAccountExist(
    bankAccount: Partial<BankAccountEntity>,
    excludedId?: number,
    cabinetId?: number,
  ): Promise<boolean> {
    const payload = this.withDefaults(bankAccount);

    if (payload.type === BANK_ACCOUNT_TYPE.CASH) {
      const accounts = await this.bankAccountRepository.findAll({
        where: {
          name: payload.name,
          type: BANK_ACCOUNT_TYPE.CASH,
          ...(cabinetId ? { cabinetId } : {}),
          deletedAt: null,
        } as FindManyOptions<BankAccountEntity>['where'],
      });

      return accounts.some((account) => account.id !== excludedId);
    }

    const accounts = await this.bankAccountRepository.findAll({
      where: {
        iban: payload.iban,
        type: BANK_ACCOUNT_TYPE.BANK,
        ...(cabinetId ? { cabinetId } : {}),
        deletedAt: null,
      } as FindManyOptions<BankAccountEntity>['where'],
    });

    return accounts.some((account) => account.id !== excludedId);
  }

  async findMainAccount(cabinetId?: number): Promise<BankAccountEntity> {
    return this.bankAccountRepository.findOne({
      where: {
        isMain: true,
        ...(cabinetId ? { cabinetId } : {}),
      },
    });
  }

  //promote bank account to main account
  async promote(account: BankAccountEntity): Promise<BankAccountEntity> {
    account.isMain = true;
    account.isDeletionRestricted = true;
    return this.bankAccountRepository.save(account);
  }

  //demote bank account to normal account
  async demote(account: BankAccountEntity): Promise<BankAccountEntity> {
    account.isMain = false;
    account.isDeletionRestricted = false;
    return this.bankAccountRepository.save(account);
  }

  async save(
    createBankAccountDto: CreateBankAccountDto,
    userId?: string,
  ): Promise<ResponseBankAccountDto> {
    const cabinetId = userId
      ? await this.tenantContextService.getCurrentCabinetIdOrFail(userId)
      : (createBankAccountDto as CreateBankAccountDto & { cabinetId?: number })
          .cabinetId;
    const payload = this.withDefaults(createBankAccountDto);

    this.ensureBankAccountPayloadIsValid(payload);

    if (await this.doesBankAccountExist(payload, undefined, cabinetId)) {
      throw new BankAccountAlreadyExistsException();
    }

    let isDeletionRestricted = false;
    const count = await this.bankAccountRepository.getTotalCount({
      where: cabinetId ? { cabinetId } : {},
    });
    if (count === 0) {
      payload.isMain = true;
      isDeletionRestricted = true;
    }

    if (payload.isMain) {
      const currentMainAccount = await this.findMainAccount(cabinetId);
      if (currentMainAccount) {
        await this.demote(currentMainAccount);
      }
    }

    const createdAccount = await this.bankAccountRepository.save({
      ...payload,
      cabinetId,
      isDeletionRestricted,
    });

    return this.attachBalance(createdAccount);
  }

  async saveMany(
    createBankAccountDto: CreateBankAccountDto[],
  ): Promise<BankAccountEntity[]> {
    for (const dto of createBankAccountDto) {
      const payload = this.withDefaults(dto);
      this.ensureBankAccountPayloadIsValid(payload);

      if (await this.doesBankAccountExist(payload)) {
        throw new BankAccountAlreadyExistsException();
      }
    }

    return this.bankAccountRepository.saveMany(
      createBankAccountDto.map((dto) => this.withDefaults(dto)),
    );
  }

  async update(
    id: number,
    updateBankAccountDto: UpdateBankAccountDto,
    userId?: string,
  ): Promise<ResponseBankAccountDto> {
    const existingBankAccount = await this.findOneById(id, userId);
    const cabinetId = existingBankAccount.cabinetId;
    const payload = this.withDefaults({
      ...existingBankAccount,
      ...updateBankAccountDto,
    });

    this.ensureBankAccountPayloadIsValid(payload);

    if (existingBankAccount.isMain && payload.isMain === false) {
      throw new BadRequestException(
        'Promote another main account before removing this status',
      );
    }

    if (await this.doesBankAccountExist(payload, id, cabinetId)) {
      throw new BankAccountAlreadyExistsException();
    }

    if (payload.isMain) {
      const currentMainAccount = await this.findMainAccount(cabinetId);
      if (currentMainAccount && currentMainAccount.id !== id) {
        await this.demote(currentMainAccount);
      }
    }

    const updatedAccount = await this.bankAccountRepository.save({
      ...existingBankAccount,
      ...payload,
      cabinetId,
      isDeletionRestricted: payload.isMain,
    });

    return this.attachBalance(updatedAccount);
  }

  async softDelete(
    id: number,
    userId?: string,
  ): Promise<ResponseBankAccountDto> {
    const account = await this.findOneById(id, userId);
    if (account.isMain) throw new BankAccountCannotBeDeletedException();

    const deletedAccount = await this.bankAccountRepository.softDelete(id);
    return this.attachBalance(deletedAccount);
  }

  async deleteAll() {
    return this.bankAccountRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.bankAccountRepository.getTotalCount();
  }
}
