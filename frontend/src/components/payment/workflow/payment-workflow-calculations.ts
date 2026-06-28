import { CREDIT_NOTE_STATUS, CreditNote, Currency, PaymentCreditNoteEntry } from '@/types';
import { roundPaymentAmount } from './payment-workflow-utils';

export const availableCreditNoteStatuses = [
  CREDIT_NOTE_STATUS.Unpaid,
  CREDIT_NOTE_STATUS.PartiallyPaid,
  CREDIT_NOTE_STATUS.Validated,
  CREDIT_NOTE_STATUS.Sent
];

export const getCreditNoteAvailableAmount = (creditNote?: CreditNote) =>
  Math.max((creditNote?.total || 0) - (creditNote?.amountPaid || 0), 0);

export const isCreditNoteAvailableForPayment = (creditNote?: CreditNote) =>
  !!creditNote &&
  !!creditNote.id &&
  availableCreditNoteStatuses.includes(creditNote.status as CREDIT_NOTE_STATUS) &&
  getCreditNoteAvailableAmount(creditNote) > 0;

export const getCreditNoteExchangeRate = (
  creditNote?: CreditNote,
  paymentCurrency?: Currency,
  entry?: PaymentCreditNoteEntry
) => {
  if (!creditNote || !paymentCurrency || creditNote.currencyId === paymentCurrency.id) return 1;
  return Number(entry?.exchangeRateToPaymentCurrency || 0);
};

export const getCreditNoteConvertedAmount = (
  amount: number,
  creditNote?: CreditNote,
  paymentCurrency?: Currency,
  exchangeRateToPaymentCurrency = 1
) => {
  if (!creditNote || !paymentCurrency) return 0;
  const safeAmount = Math.max(Number(amount || 0), 0);
  const rate = creditNote.currencyId === paymentCurrency.id ? 1 : Number(exchangeRateToPaymentCurrency || 0);
  if (rate <= 0) return 0;
  return roundPaymentAmount(safeAmount * rate, paymentCurrency);
};

export const getCreditNoteEntryCoverageAmount = (
  entry?: PaymentCreditNoteEntry,
  paymentCurrency?: Currency
) => roundPaymentAmount(Number(entry?.convertedAmount ?? entry?.amount ?? 0), paymentCurrency);

export const getCreditNoteCoverageAmount = (
  entries: PaymentCreditNoteEntry[],
  paymentCurrency?: Currency
) =>
  roundPaymentAmount(
    entries.reduce((sum, entry) => sum + getCreditNoteEntryCoverageAmount(entry, paymentCurrency), 0),
    paymentCurrency
  );
