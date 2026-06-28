import { isAfter, isBefore, startOfDay } from 'date-fns';
import { DateRange } from '@/types';

export const validateDocumentDateRange = (
  value: Date | string,
  dateRange?: DateRange
): string | null => {
  const documentDate = startOfDay(new Date(value));

  if (dateRange?.from) {
    const minimumDate = startOfDay(dateRange.from);
    if (isBefore(documentDate, minimumDate)) {
      return `La date doit être après ou égale à ${minimumDate.toLocaleDateString()}`;
    }
  }

  if (dateRange?.to) {
    const maximumDate = startOfDay(dateRange.to);
    if (isAfter(documentDate, maximumDate)) {
      return `La date doit être avant ou égale à ${maximumDate.toLocaleDateString()}`;
    }
  }

  return null;
};
