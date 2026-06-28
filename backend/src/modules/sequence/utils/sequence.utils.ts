import { format } from 'date-fns';
import { DateFormat } from 'src/modules/sequence/enums/date-format.enum';

const DateFormat_PATTERNS: { [key in DateFormat]: RegExp } = {
  [DateFormat.YYYY]: /^\d{4}$/,
  [DateFormat.YYMM]: /^\d{2}-\d{2}$/,
  [DateFormat.YYYYMM]: /^\d{4}-\d{2}$/,
};

const DATE_FNS_PATTERNS: Record<DateFormat, string> = {
  [DateFormat.YYYY]: 'yyyy',
  [DateFormat.YYMM]: 'yy-MM',
  [DateFormat.YYYYMM]: 'yyyy-MM',
};

export function parseSequentialNumber(sequence?: string | null): number | null {
  const match = sequence?.match(/-(\d+)$/);
  if (!match) return null;

  const value = Number.parseInt(match[1], 10);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function parseSequential(sequence: string) {
  const regex = /^(.+?)-(\d{4}-\d{2}|\d{2}-\d{2}|\d{4})-(\d+)$/;
  const match = sequence.match(regex);

  if (!match) {
    return {
      prefix: '',
      dateFormat: DateFormat.YYYY,
      next: 0,
    };
  }

  const [, prefix, dateFormat, nextStr] = match;
  const next = parseInt(nextStr, 10);

  const knownFormat =
    (Object.keys(DateFormat_PATTERNS).find((format) =>
      DateFormat_PATTERNS[format as DateFormat].test(dateFormat),
    ) as DateFormat) || DateFormat.YYYY;

  return {
    prefix,
    dateFormat: knownFormat,
    next: isNaN(next) ? 0 : next,
  };
}

export function formSequential(
  prefix: string,
  dateFormat: DateFormat,
  next: number,
  date: Date = new Date(),
): string {
  return `${prefix}-${format(date, DATE_FNS_PATTERNS[dateFormat])}-${next}`;
}

interface SequentialDocument {
  id: number;
  sequential: string;
}

export function findSequentialNeighbors<T extends SequentialDocument>(
  current: T,
  documents: T[],
): { previous: T | null; next: T | null } {
  const currentSequence = parseSequential(current.sequential);
  const currentNumber = currentSequence.next;
  if (!currentSequence.prefix || currentNumber < 1) {
    return { previous: null, next: null };
  }

  let previous: T | null = null;
  let next: T | null = null;
  let previousNumber = Number.NEGATIVE_INFINITY;
  let nextNumber = Number.POSITIVE_INFINITY;

  for (const document of documents) {
    if (document.id === current.id) continue;

    const documentSequence = parseSequential(document.sequential);
    if (
      documentSequence.prefix !== currentSequence.prefix ||
      documentSequence.next < 1
    ) {
      continue;
    }
    const documentNumber = documentSequence.next;

    if (documentNumber < currentNumber && documentNumber > previousNumber) {
      previous = document;
      previousNumber = documentNumber;
    }

    if (documentNumber > currentNumber && documentNumber < nextNumber) {
      next = document;
      nextNumber = documentNumber;
    }
  }

  return { previous, next };
}
