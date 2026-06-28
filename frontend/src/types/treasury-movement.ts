import { BankAccount } from './bank-account';
import { Currency } from './currency';
import { PagedResponse } from './response';
import { DatabaseEntity } from './response/DatabaseEntity';

export enum TREASURY_MOVEMENT_KIND {
  EXPENSE = 'expense',
  INCOME = 'income',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer'
}

export enum TREASURY_MOVEMENT_DIRECTION {
  IN = 'in',
  OUT = 'out'
}

export interface TreasuryMovement extends DatabaseEntity {
  id?: number;
  accountId?: number;
  currencyId?: number;
  account?: BankAccount;
  currency?: Currency;
  kind?: TREASURY_MOVEMENT_KIND;
  direction?: TREASURY_MOVEMENT_DIRECTION;
  amount?: number;
  label?: string;
  notes?: string;
  movementDate?: string | Date;
}

export interface CreateTreasuryMovementDto
  extends Omit<TreasuryMovement, 'id' | 'account' | 'currency' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'isDeletionRestricted'> {}

export interface PagedTreasuryMovement extends PagedResponse<TreasuryMovement> {}
