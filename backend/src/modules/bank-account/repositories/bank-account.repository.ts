import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { BankAccountEntity } from '../entities/bank-account.entity';
import { DatabaseAbstractRepository } from 'src/shared/database/repositories/database.repository';

@Injectable()
export class BankAccountRepository extends DatabaseAbstractRepository<BankAccountEntity> {
  constructor(
    @InjectRepository(BankAccountEntity)
    private readonly bankAccountRepository: Repository<BankAccountEntity>,
    txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {
    super(bankAccountRepository, txHost);
  }

  async getBalances(accountIds: number[]): Promise<Record<number, number>> {
    if (!accountIds.length) return {};

    const rows = await this.createQueryBuilder('account')
      .select('account.id', 'accountId')
      .addSelect(
        `
          COALESCE(
            SUM(
              CASE
                WHEN movement.direction = 'in' THEN movement.amount
                ELSE -movement.amount
              END
            ),
            0
          )
        `,
        'balance',
      )
      .leftJoin(
        'treasury_movement',
        'movement',
        'movement.accountId = account.id AND movement.deletedAt IS NULL',
      )
      .where('account.id IN (:...accountIds)', { accountIds })
      .groupBy('account.id')
      .getRawMany<{ accountId: string; balance: string }>();

    return rows.reduce<Record<number, number>>((acc, row) => {
      acc[Number(row.accountId)] = Number(row.balance ?? 0);
      return acc;
    }, {});
  }
}
