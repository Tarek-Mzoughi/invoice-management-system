import {
  ACTIVITY_TYPE,
  Payment,
  PAYMENT_COLLECTION_STATUS,
  PAYMENT_MODE
} from '@/types';
import {
  getPaymentStatusTranslationKey,
  getPaymentStatusClassName
} from '@/utils/payment.utils';

const parseDateValue = (value?: string | Date | null) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getIntlLocale = (language?: string) =>
  language?.toLowerCase().startsWith('fr') ? 'fr-FR' : 'en-US';

export const WORKFLOW_COLLECTION_STATUSES: PAYMENT_COLLECTION_STATUS[] = [
  PAYMENT_COLLECTION_STATUS.Pending,
  PAYMENT_COLLECTION_STATUS.Deposited,
  PAYMENT_COLLECTION_STATUS.Paid,
  PAYMENT_COLLECTION_STATUS.Rejected
];

export const formatMoney = (
  amount: number,
  locale: string,
  currency?: { digitAfterComma?: number; symbol?: string; code?: string }
) => {
  const digits = currency?.digitAfterComma ?? 3;
  const symbol = currency?.symbol || currency?.code || 'DT';

  return `${amount.toLocaleString(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })} ${symbol}`.trim();
};

export const getValidPaymentConversionRate = (payment?: Payment | null) => {
  const rate = Number(payment?.convertionRate);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
};

export const roundAmount = (value: number, digitsAfterComma = 3) =>
  Number(value.toFixed(digitsAfterComma));

export const getConvertedPaymentAmount = (
  payment?: Payment | null,
  targetCurrency?: { digitAfterComma?: number }
) => {
  const amount = Number(payment?.amount);

  if (!payment || !Number.isFinite(amount)) {
    return null;
  }

  const rate = getValidPaymentConversionRate(payment);
  if (!rate) {
    return null;
  }

  const digits =
    targetCurrency?.digitAfterComma ?? payment.currency?.digitAfterComma ?? 3;

  return roundAmount(amount * rate, digits);
};

export const formatPaymentAmount = (
  payment: Payment,
  locale: string,
  { signed = false }: { signed?: boolean } = {}
) => {
  const rawAmount = payment.amount ?? 0;
  const signedAmount =
    signed && payment.activityType === ACTIVITY_TYPE.BUYING ? -Math.abs(rawAmount) : rawAmount;
  const formatted = formatMoney(Math.abs(signedAmount), locale, payment.currency);

  if (!signed) {
    return formatted;
  }

  return `${signedAmount >= 0 ? '+' : '-'} ${formatted}`;
};

export const formatDateTime = (value?: string | Date | null, locale: string = 'fr-FR') => {
  const parsed = parseDateValue(value);
  if (!parsed) return '-';

  const day = new Intl.DateTimeFormat(locale, { day: '2-digit' }).format(parsed);
  const month = new Intl.DateTimeFormat(locale, { month: 'long' }).format(parsed);
  const year = new Intl.DateTimeFormat(locale, { year: 'numeric' }).format(parsed);
  const hour = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(parsed);

  if (locale.toLowerCase().startsWith('fr')) {
    return `${day} ${month}, ${year} ${hour}`;
  }

  return `${month} ${day}, ${year} ${hour}`;
};

export const formatDateOnly = (value?: string | Date | null, locale: string = 'fr-FR') => {
  const parsed = parseDateValue(value);
  if (!parsed) return '-';

  const day = new Intl.DateTimeFormat(locale, { day: '2-digit' }).format(parsed);
  const month = new Intl.DateTimeFormat(locale, { month: 'long' }).format(parsed);
  const year = new Intl.DateTimeFormat(locale, { year: 'numeric' }).format(parsed);

  if (locale.toLowerCase().startsWith('fr')) {
    return `${day} ${month} ${year}`;
  }

  return `${month} ${day}, ${year}`;
};

export const isDueDateReached = (payment?: Payment) => {
  const dueDate = parseDateValue(payment?.dueDate);
  if (!dueDate) return true;

  const endOfDueDate = new Date(dueDate);
  endOfDueDate.setHours(23, 59, 59, 999);

  return endOfDueDate.getTime() <= Date.now();
};

export const getPaymentTypeTranslationKey = (mode?: PAYMENT_MODE) => {
  switch (mode) {
    case PAYMENT_MODE.BillOfExchange:
      return 'treasury_checks_and_drafts.types.bill_of_exchange';
    case PAYMENT_MODE.Check:
      return 'treasury_checks_and_drafts.types.check';
    default:
      return 'treasury_checks_and_drafts.types.unknown';
  }
};

export const getInstrumentLabel = (mode?: PAYMENT_MODE) =>
  mode === PAYMENT_MODE.BillOfExchange ? 'draft' : 'check';

export const getDirectionTranslationKey = (activityType?: ACTIVITY_TYPE) =>
  activityType === ACTIVITY_TYPE.BUYING
    ? 'treasury_checks_and_drafts.directions.out'
    : 'treasury_checks_and_drafts.directions.in';

export const getPaymentTypeClassName = (mode?: PAYMENT_MODE) => {
  switch (mode) {
    case PAYMENT_MODE.BillOfExchange:
      return 'border-blue-100 bg-blue-50 text-blue-600';
    case PAYMENT_MODE.Check:
      return 'border-emerald-100 bg-emerald-50 text-emerald-600';
    default:
      return 'border-zinc-100 bg-zinc-50 text-zinc-600';
  }
};

export const getDirectionClassName = (activityType?: ACTIVITY_TYPE) =>
  activityType === ACTIVITY_TYPE.BUYING
    ? 'border-rose-100 bg-rose-50 text-rose-600'
    : 'border-emerald-100 bg-emerald-50 text-emerald-600';

export const getEntityName = (payment?: Payment) =>
  payment?.firm?.name || payment?.firmId?.toString() || '-';

export const getTreasuryAccountName = (payment?: Payment) =>
  payment?.treasuryAccount?.name || payment?.originTreasuryAccount?.name || '-';
