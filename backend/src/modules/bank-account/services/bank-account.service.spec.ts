import { BadRequestException } from '@nestjs/common';
import { BankAccountRepository } from '../repositories/bank-account.repository';
import { BANK_ACCOUNT_TYPE } from '../enums/bank-account-type.enum';
import { BankAccountService } from './bank-account.service';
import { TenantContextService } from 'src/shared/tenant/tenant-context.service';

describe('BankAccountService', () => {
  let service: BankAccountService;
  let repository: jest.Mocked<BankAccountRepository>;
  let tenantContext: jest.Mocked<TenantContextService>;

  beforeEach(() => {
    repository = {
      findOneById: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      getTotalCount: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      softDelete: jest.fn(),
      deleteAll: jest.fn(),
      getBalances: jest.fn(),
    } as unknown as jest.Mocked<BankAccountRepository>;

    tenantContext = {
      getCurrentCabinetIdOrFail: jest.fn(),
      assertUserCanAccessCabinet: jest.fn(),
      scopeQueryToCabinet: jest.fn(),
      scopeQueryToCabinetField: jest.fn(),
    } as unknown as jest.Mocked<TenantContextService>;

    service = new BankAccountService(repository, tenantContext);
  });

  it('rejects cash accounts without a currency', async () => {
    await expect(
      service.save({
        name: 'Caisse principale',
        type: BANK_ACCOUNT_TYPE.CASH,
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects bank accounts without agency and iban', async () => {
    await expect(
      service.save({
        name: 'Compte bancaire',
        type: BANK_ACCOUNT_TYPE.BANK,
        currencyId: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects bank accounts without bic and rib', async () => {
    await expect(
      service.save({
        name: 'Compte bancaire',
        type: BANK_ACCOUNT_TYPE.BANK,
        currencyId: 1,
        agency: 'Centre Urbain Nord',
        iban: 'TN5901006035183598478831',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('prevents removing the main status from the current main account', async () => {
    repository.findOneById.mockResolvedValue({
      id: 1,
      name: 'Compte principal',
      type: BANK_ACCOUNT_TYPE.BANK,
      currencyId: 1,
      bic: 'ABCDEFGHXXX',
      rib: '12345678901234567890',
      agency: 'Centre Urbain Nord',
      iban: 'TN5901006035183598478831',
      isMain: true,
    } as never);

    await expect(
      service.update(1, {
        name: 'Compte principal',
        type: BANK_ACCOUNT_TYPE.BANK,
        currencyId: 1,
        bic: 'ABCDEFGHXXX',
        rib: '12345678901234567890',
        agency: 'Centre Urbain Nord',
        iban: 'TN5901006035183598478831',
        isMain: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('aggregates balances when listing accounts', async () => {
    repository.getTotalCount.mockResolvedValue(2);
    repository.findAll.mockResolvedValue([
      { id: 1, name: 'Compte bancaire', isMain: true },
      { id: 2, name: 'Caisse', isMain: false },
    ] as never);
    repository.getBalances.mockResolvedValue({ 1: 125.5, 2: -20 });

    const result = await service.findAllPaginated({
      page: '1',
      limit: '10',
    } as never);

    expect(result.data).toEqual([
      expect.objectContaining({ id: 1, balance: 125.5 }),
      expect.objectContaining({ id: 2, balance: -20 }),
    ]);
  });
});
