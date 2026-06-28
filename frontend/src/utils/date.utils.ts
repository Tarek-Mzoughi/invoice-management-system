import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export function transformDate(dateString: string) {
  const date = parseISO(dateString);
  return format(date, 'dd-MM-yyyy');
}

export function transformDate2(dateString: string, local: string = 'fr-FR') {
  const date = new Date(dateString);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '...';
  }
  const day = formatInTimeZone(date, timeZone, 'dd');
  const month = formatInTimeZone(date, timeZone, 'LLL');
  const year = formatInTimeZone(date, timeZone, 'y');
  return `${day} ${month}, ${year}`;
}

export function transformDateTime(dateString: string) {
  const date = parseISO(dateString);
  return format(date, 'yyyy-MM-dd HH:mm:ss');
}
