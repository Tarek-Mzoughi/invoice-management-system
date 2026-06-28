import dinero from 'dinero.js';
import { Currency, Invoice, PaymentInvoiceEntry } from '@/types';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';

export const toMoneyUnit = (value: number, precision = 3) =>
  dinero({
    amount: createDineroAmountFromFloatWithDynamicCurrency(value || 0, precision),
    precision
  }).toUnit();

export const roundPaymentAmount = (value: number, currency?: Currency) =>
  toMoneyUnit(value, currency?.digitAfterComma || 3);

export const getInvoiceRemainingAmount = (invoice?: Invoice): number => {
  if (!invoice) return 0;

  const total = invoice.total || 0;
  const amountPaid = invoice.amountPaid || 0;
  const amountSettled = invoice.amountSettled || 0;
  const taxWithholdingAmount = invoice.taxWithholdingAmount || 0;

  return Math.max(total - amountPaid - amountSettled - taxWithholdingAmount, 0);
};

export const convertInvoiceAmountToPaymentCurrency = (
  amount: number,
  invoice?: Invoice,
  paymentCurrency?: Currency,
  convertionRate = 1
) => {
  if (!invoice || !paymentCurrency || invoice.currencyId === paymentCurrency.id) {
    return amount;
  }

  const safeRate = convertionRate > 0 ? convertionRate : 1;
  return amount / safeRate;
};

export const convertPaymentAmountToInvoiceCurrency = (
  amount: number,
  invoice?: Invoice,
  paymentCurrency?: Currency,
  convertionRate = 1
) => {
  if (!invoice || !paymentCurrency || invoice.currencyId === paymentCurrency.id) {
    return amount;
  }

  const safeRate = convertionRate > 0 ? convertionRate : 1;
  return amount * safeRate;
};

export const getEntryCoverageInInvoiceCurrency = (
  entry: PaymentInvoiceEntry,
  paymentCurrency?: Currency,
  convertionRate = 1
) => convertPaymentAmountToInvoiceCurrency(entry.amount || 0, entry.invoice, paymentCurrency, convertionRate);

export const formatAmount = (amount: number, currency?: Currency) => {
  const precision = currency?.digitAfterComma || 3;
  const symbol = currency?.symbol || currency?.code || '';

  return `${roundPaymentAmount(amount, currency).toFixed(precision)} ${symbol}`.trim();
};
