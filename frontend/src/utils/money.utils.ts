import dinero, { Dinero, Currency as DineroCurrency } from 'dinero.js';

export async function convertAmount(amount: Dinero, rate: number, targetCurrency: DineroCurrency) {
  const rates = {
    rates: {
      [targetCurrency]: rate
    }
  };
  const convertedAmount = await amount.convert(targetCurrency, {
    endpoint: new Promise((resolve) => resolve(rates))
  });
  return convertedAmount;
}

export function createDineroAmountFromFloatWithDynamicCurrency(
  value: number,
  digitAfterComma: number
) {
  return Math.round(value * Math.pow(10, digitAfterComma));
}
