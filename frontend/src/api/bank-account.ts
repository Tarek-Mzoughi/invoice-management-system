import axios from './axios';
import {
  BANK_ACCOUNT_TYPE,
  BankAccount,
  CreateBankAccountDto,
  PagedBankAccount,
  ToastValidation,
  UpdateBankAccountDto
} from '@/types';
import { BANK_ACCOUNT_FILTER_ATTRIBUTES } from '@/constants/bank-account.filter-attributes';
import type { ApiRequestOptions } from './request-options';

const normalizeOptionalString = (value?: string | null) => {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : undefined;
};

const factory = (): BankAccount => {
  return {
    id: undefined,
    name: '',
    type: BANK_ACCOUNT_TYPE.BANK,
    agency: '',
    bic: '',
    currency: undefined,
    currencyId: undefined,
    iban: '',
    rib: '',
    balance: 0,
    isMain: false
  };
};

const serializePayload = (bankAccount: Partial<BankAccount>): Partial<BankAccount> => {
  const type = bankAccount.type ?? BANK_ACCOUNT_TYPE.BANK;
  const isBankAccount = type === BANK_ACCOUNT_TYPE.BANK;

  return {
    id: bankAccount.id,
    name: normalizeOptionalString(bankAccount.name),
    type,
    agency: isBankAccount ? normalizeOptionalString(bankAccount.agency) : undefined,
    bic: isBankAccount ? normalizeOptionalString(bankAccount.bic) : undefined,
    rib: isBankAccount ? normalizeOptionalString(bankAccount.rib) : undefined,
    iban: isBankAccount ? normalizeOptionalString(bankAccount.iban) : undefined,
    currencyId: bankAccount.currencyId ?? bankAccount.currency?.id,
    isMain: bankAccount.isMain
  };
};

const buildGeneralFilters = (search: string = '', type?: BANK_ACCOUNT_TYPE) => {
  const searchableAttributes = [
    BANK_ACCOUNT_FILTER_ATTRIBUTES.NAME,
    BANK_ACCOUNT_FILTER_ATTRIBUTES.TYPE,
    BANK_ACCOUNT_FILTER_ATTRIBUTES.AGENCY,
    BANK_ACCOUNT_FILTER_ATTRIBUTES.IBAN
  ];

  const searchFilters = search ? searchableAttributes.map((key) => `${key}||$cont||${search}`) : [];

  if (type) {
    if (!searchFilters.length) return `type||$eq||${type}`;
    return searchFilters.map((condition) => `${condition};type||$eq||${type}`).join('||$or||');
  }

  return searchFilters.join('||$or||');
};

const findPaginated = async (
  page: number = 1,
  size: number = 5,
  order: 'ASC' | 'DESC' = 'ASC',
  sortKey: string = '',
  search: string = '',
  type?: BANK_ACCOUNT_TYPE
): Promise<PagedBankAccount> => {
  const generalFilters = buildGeneralFilters(search, type);

  let requestUrl = `public/bank-account/list?join=currency&limit=${size}&page=${page}`;

  if (sortKey) {
    requestUrl += `&sort=${sortKey},${order}`;
  }

  if (generalFilters) {
    requestUrl += `&filter=${generalFilters}`;
  }

  const response = await axios.get<PagedBankAccount>(requestUrl);
  return response.data;
};

const find = async (
  type?: BANK_ACCOUNT_TYPE,
  options: ApiRequestOptions = {}
): Promise<BankAccount[]> => {
  const filters = buildGeneralFilters('', type);
  const response = await axios.get<BankAccount[]>(
    `public/bank-account/all${filters ? `?filter=${filters}` : ''}`,
    { silentForbiddenToast: options.silentForbiddenToast }
  );
  return response.data;
};

const create = async (bankAccount: CreateBankAccountDto): Promise<BankAccount> => {
  const response = await axios.post<BankAccount>(
    'public/bank-account',
    serializePayload(bankAccount)
  );
  return response.data;
};

const update = async (bankAccount: UpdateBankAccountDto): Promise<BankAccount> => {
  const response = await axios.put<BankAccount>(
    `public/bank-account/${bankAccount.id}`,
    serializePayload(bankAccount)
  );
  return response.data;
};

const remove = async (id: number) => {
  const { data, status } = await axios.delete<BankAccount>(`public/bank-account/${id}`);
  return { data, status };
};

const validate = (
  bankAccount: Partial<BankAccount>,
  mainByDefault: boolean = false,
  currentMainLocked: boolean = false
): ToastValidation => {
  const name = bankAccount?.name?.trim();
  const agency = bankAccount?.agency?.trim();
  const bic = bankAccount?.bic?.trim();
  const rib = bankAccount?.rib?.trim();
  const iban = bankAccount?.iban?.trim();

  if (!name) return { message: 'bank_account.errors.name_required' };
  if (name.length < 3) return { message: 'bank_account.errors.name_min_length' };
  if (!(bankAccount?.currencyId || bankAccount?.currency?.id))
    return { message: 'bank_account.errors.currency_required' };
  if ((bankAccount?.type ?? BANK_ACCOUNT_TYPE.BANK) === BANK_ACCOUNT_TYPE.BANK) {
    if (!bic) return { message: 'bank_account.errors.bic_required' };
    if (!rib) return { message: 'bank_account.errors.rib_required' };
    if (!agency) return { message: 'bank_account.errors.agency_required' };
    if (!iban) return { message: 'bank_account.errors.iban_required' };
  }
  if (mainByDefault && !bankAccount.isMain)
    return { message: 'bank_account.errors.main_required' };
  if (currentMainLocked && !bankAccount.isMain)
    return { message: 'bank_account.errors.main_locked' };
  return { message: '' };
};

export const bankAccount = {
  find,
  findPaginated,
  factory,
  create,
  update,
  remove,
  validate
};
