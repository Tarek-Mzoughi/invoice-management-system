import { Trans as NativeTrans } from 'react-i18next';
import { Skeleton } from './ui/skeleton';

interface TransProps {
  ns?: string;
  i18nKey?: string;
  values?: any;
  isPending?: boolean;
}

export const Trans = ({ ns, i18nKey, values, isPending = false }: TransProps) => {
  if (isPending) return <Skeleton className="h-5 w-full bg-zinc-300/75" />;
  return <NativeTrans ns={ns} i18nKey={i18nKey} values={values} />;
};
