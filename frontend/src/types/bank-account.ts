import { BANK_ACCOUNT_TYPE } from './enums';
import { Currency } from './currency';
import { PagedResponse } from './response';
import { DatabaseEntity } from './response/DatabaseEntity';

export interface BankAccount extends DatabaseEntity {
  id?: number;
  name?: string;
  type?: BANK_ACCOUNT_TYPE;
  agency?: string;
  bic?: string;
  rib?: string;
  iban?: string;
  balance?: number;
  currency?: Currency;
  currencyId?: number;
  isMain?: boolean;
}

export interface CreateBankAccountDto
  extends Omit<BankAccount, 'id' | 'currency' | 'isDeletionRestricted'> {}
export interface UpdateBankAccountDto
  extends Omit<BankAccount, 'currency' | 'isDeletionRestricted'> {}
export interface PagedBankAccount extends PagedResponse<BankAccount> {}
