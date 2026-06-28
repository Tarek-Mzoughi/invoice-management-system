export function normalizeDineroPrecision(
  digitAfterComma?: number | string | null,
  fallback: number = 3,
) {
  const parsedPrecision =
    typeof digitAfterComma === 'string'
      ? Number.parseInt(digitAfterComma, 10)
      : Number(digitAfterComma);

  return Number.isInteger(parsedPrecision) && parsedPrecision >= 0
    ? parsedPrecision
    : fallback;
}

export function createDineroAmountFromFloatWithDynamicCurrency(
  value: number,
  digitAfterComma: number,
) {
  const precision = normalizeDineroPrecision(digitAfterComma);
  const normalizedValue = Number.isFinite(Number(value)) ? Number(value) : 0;

  return Math.round(normalizedValue * Math.pow(10, precision));
}
