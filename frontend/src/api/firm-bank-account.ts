import axios from './axios';
import {
  FirmBankAccount,
  CreateFirmBankAccountDto,
  UpdateFirmBankAccountDto,
  ToastValidation
} from '@/types';
import type { ApiRequestOptions } from './request-options';

const normalizeOptionalString = (value?: string | null) => {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : undefined;
};

const factory = (): FirmBankAccount => {
  return {
    id: undefined,
    name: '',
    bic: '',
    rib: '',
    iban: '',
    currency: undefined,
    currencyId: undefined,
    isMain: false,
    firmId: undefined
  };
};

const serializePayload = (bankAccount: Partial<FirmBankAccount>): Partial<FirmBankAccount> => {
  const normalizedIban = normalizeOptionalString(bankAccount.iban)?.replace(/\s+/g, '');
  return {
    id: bankAccount.id,
    name: normalizeOptionalString(bankAccount.name),
    bic: normalizeOptionalString(bankAccount.bic),
    rib: normalizeOptionalString(bankAccount.rib),
    iban: normalizedIban,
    currencyId: bankAccount.currencyId ?? bankAccount.currency?.id,
    isMain: bankAccount.isMain,
    firmId: bankAccount.firmId
  };
};

const find = async (
  firmId?: number,
  options: ApiRequestOptions = {}
): Promise<FirmBankAccount[]> => {
  let url = 'public/firm-bank-account/all?join=currency';
  if (firmId) {
    url += `&filter=firmId||$eq||${firmId}`;
  }
  const response = await axios.get<FirmBankAccount[]>(url, {
    silentForbiddenToast: options.silentForbiddenToast
  });
  return response.data;
};

const create = async (bankAccount: CreateFirmBankAccountDto): Promise<FirmBankAccount> => {
  const response = await axios.post<FirmBankAccount>(
    'public/firm-bank-account',
    serializePayload(bankAccount)
  );
  return response.data;
};

const update = async (bankAccount: UpdateFirmBankAccountDto): Promise<FirmBankAccount> => {
  const response = await axios.put<FirmBankAccount>(
    `public/firm-bank-account/${bankAccount.id}`,
    serializePayload(bankAccount)
  );
  return response.data;
};

const remove = async (id: number) => {
  const { data, status } = await axios.delete<FirmBankAccount>(`public/firm-bank-account/${id}`);
  return { data, status };
};

const validate = (
  bankAccount: Partial<FirmBankAccount>
): ToastValidation => {
  const name = bankAccount?.name?.trim();
  const iban = bankAccount?.iban?.trim();

  if (!name) return { message: 'firm.errors.bank_account_name_required' };
  if (name.length < 3) return { message: 'firm.errors.bank_account_name_min_length' };
  if (!(bankAccount?.currencyId || bankAccount?.currency?.id))
    return { message: 'firm.errors.bank_account_currency_required' };
  
  if (iban && iban.length > 0) {
    // Support any valid international IBAN format (removes spaces first)
    const normalizedIban = iban.replace(/\s+/g, '');
    const ibanRegex = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/i;
    if (!ibanRegex.test(normalizedIban)) {
      return { message: 'firm.errors.bank_account_iban_invalid' };
    }
  }

  return { message: '' };
};

export const firmBankAccount = {
  find,
  factory,
  create,
  update,
  remove,
  validate
};
