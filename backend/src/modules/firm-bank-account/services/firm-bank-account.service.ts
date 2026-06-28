import { Injectable } from '@nestjs/common';
import { PageDto } from 'src/shared/database/dtos/database.page.dto';
import { PageMetaDto } from 'src/shared/database/dtos/database.page-meta.dto';
import { IQueryObject } from 'src/shared/database/interfaces/database-query-options.interface';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { QueryBuilder } from 'src/shared/database/utils/database-query-builder';
import { FirmBankAccountRepository } from '../repositories/firm-bank-account.repository';
import { FirmBankAccountEntity } from '../entities/firm-bank-account.entity';
import { FirmBankAccountNotFoundException } from '../errors/firm-bank-account.notfound.error';
import { ResponseFirmBankAccountDto } from '../dtos/firm-bank-account.response.dto';
import { CreateFirmBankAccountDto } from '../dtos/firm-bank-account.create.dto';
import { FirmBankAccountAlreadyExistsException } from '../errors/firm-bank-account.alreadyexists.error';
import { UpdateFirmBankAccountDto } from '../dtos/firm-bank-account.update.dto';

@Injectable()
export class FirmBankAccountService {
  constructor(
    private readonly bankAccountRepository: FirmBankAccountRepository,
  ) {}

  //return a sorted list of bank accounts
  sortedBankAccounts(
    bankAccounts: FirmBankAccountEntity[],
  ): FirmBankAccountEntity[] {
    return bankAccounts.sort((a, b) => {
      const aIsMain = a?.isMain ?? false;
      const bIsMain = b?.isMain ?? false;
      return Number(bIsMain) - Number(aIsMain);
    });
  }

  async findOneById(
    id: number,
    relations?: string[],
  ): Promise<FirmBankAccountEntity> {
    const account = await this.bankAccountRepository.findOne({
      where: { id },
      relations: relations,
    });
    if (!account) {
      throw new FirmBankAccountNotFoundException();
    }
    return account;
  }

  async findOneByCondition(
    query: IQueryObject,
  ): Promise<ResponseFirmBankAccountDto | null> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    const account = await this.bankAccountRepository.findOne(
      queryOptions as FindOneOptions<FirmBankAccountEntity>,
    );
    if (!account) return null;
    return account;
  }

  async findAll(query: IQueryObject): Promise<ResponseFirmBankAccountDto[]> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);
    return this.sortedBankAccounts(
      await this.bankAccountRepository.findAll(
        queryOptions as FindManyOptions<FirmBankAccountEntity>,
      ),
    );
  }

  async findAllPaginated(
    query: IQueryObject,
  ): Promise<PageDto<ResponseFirmBankAccountDto>> {
    const queryBuilder = new QueryBuilder();
    const queryOptions = queryBuilder.build(query);

    const count = await this.bankAccountRepository.getTotalCount({
      where: queryOptions.where,
    });

    const entities = this.sortedBankAccounts(
      await this.bankAccountRepository.findAll(
        queryOptions as FindManyOptions<FirmBankAccountEntity>,
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
    bankAccount: Partial<FirmBankAccountEntity>,
  ): Promise<boolean> {
    const existingBankAccount = await this.bankAccountRepository.findOne({
      where: { iban: bankAccount.iban, rib: bankAccount.rib, deletedAt: null },
    });
    return !!existingBankAccount;
  }

  async findMainAccount(): Promise<FirmBankAccountEntity> {
    return this.bankAccountRepository.findOne({ where: { isMain: true } });
  }

  //promote bank account to main account
  async promote(
    account: FirmBankAccountEntity,
  ): Promise<FirmBankAccountEntity> {
    account.isMain = true;
    account.isDeletionRestricted = true;
    return this.bankAccountRepository.save(account);
  }

  //demote bank account to normal account
  async demote(account: FirmBankAccountEntity): Promise<FirmBankAccountEntity> {
    account.isMain = false;
    account.isDeletionRestricted = false;
    return this.bankAccountRepository.save(account);
  }

  async save(
    createBankAccountDto: CreateFirmBankAccountDto,
  ): Promise<FirmBankAccountEntity> {
    if (await this.doesBankAccountExist(createBankAccountDto)) {
      throw new FirmBankAccountAlreadyExistsException();
    }
    //handle the case when there is no bank account , set the current account as main by default
    let isDeletionRestricted = false;
    const count = await this.bankAccountRepository.getTotalCount();
    if (count == 0) {
      createBankAccountDto.isMain = true;
      isDeletionRestricted = true;
    }
    //handle main account transition
    if (createBankAccountDto.isMain) {
      const currentMainAccount = await this.findMainAccount();
      if (currentMainAccount) {
        this.demote(currentMainAccount);
      }
    }
    return this.bankAccountRepository.save({
      ...createBankAccountDto,
      isDeletionRestricted,
    });
  }

  async saveMany(
    createBankAccountDto: CreateFirmBankAccountDto[],
  ): Promise<FirmBankAccountEntity[]> {
    for (const dto of createBankAccountDto) {
      if (await this.doesBankAccountExist(dto)) {
        throw new FirmBankAccountAlreadyExistsException();
      }
    }
    return this.bankAccountRepository.saveMany(createBankAccountDto);
  }

  async update(
    id: number,
    updateBankAccountDto: UpdateFirmBankAccountDto,
  ): Promise<FirmBankAccountEntity> {
    if (!(await this.doesBankAccountExist(updateBankAccountDto))) {
      throw new FirmBankAccountNotFoundException();
    }
    if (updateBankAccountDto.isMain) {
      const currentMainAccount = await this.findMainAccount();
      if (currentMainAccount) {
        this.demote(currentMainAccount);
      }
    }
    const existingBankAccount = await this.findOneById(id);
    return this.bankAccountRepository.save({
      ...existingBankAccount,
      ...updateBankAccountDto,
      isDeletionRestricted: updateBankAccountDto.isMain,
    });
  }

  async softDelete(id: number): Promise<FirmBankAccountEntity> {
    return this.bankAccountRepository.softDelete(id);
  }

  async deleteAll() {
    return this.bankAccountRepository.deleteAll();
  }

  async getTotal(): Promise<number> {
    return this.bankAccountRepository.getTotalCount();
  }
}
