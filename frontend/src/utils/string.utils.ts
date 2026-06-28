import { UpdateSequentialDto as Sequential } from '@/types';
import { DateFormat } from '@/types/enums/date-formats';
import { format } from 'date-fns';

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const DateFormat_PATTERNS: { [key in DateFormat]: RegExp } = {
  [DateFormat.YYYY]: /^\d{4}$/,
  [DateFormat.YYMM]: /^\d{2}-\d{2}$/,
  [DateFormat.YYYYMM]: /^\d{4}-\d{2}$/
};

export function fromStringToSequentialObject(sequence: string) {
  const regex = /^(.+?)-(\d{4}-\d{2}|\d{2}-\d{2}|\d{4})-(\d+)$/;
  const match = sequence.match(regex);

  if (!match) {
    return {
      prefix: '',
      dateFormat: DateFormat.YYYY,
      next: 0
    };
  }

  const [, prefix, dateFormat, nextStr] = match;
  const next = parseInt(nextStr, 10);

  const knownFormat =
    (Object.keys(DateFormat_PATTERNS).find((format) =>
      DateFormat_PATTERNS[format as DateFormat].test(dateFormat)
    ) as DateFormat) || DateFormat.YYYY;

  return {
    prefix,
    dateFormat: knownFormat,
    next: isNaN(next) ? 0 : next
  };
}

export const fromSequentialObjectToString = (sequence: Sequential) => {
  const { prefix, dateFormat, next } = sequence;
  const date = format(
    new Date(),
    (dateFormat || DateFormat.YYYY)?.toString().toLocaleLowerCase() || 'yyyy'
  );
  return `${prefix}-${date}-${next}`;
};

export const isValidUrl = (url: string): boolean => {
  const regex =
    /^(http(s):\/\/.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/g;
  return regex.test(url);
};
