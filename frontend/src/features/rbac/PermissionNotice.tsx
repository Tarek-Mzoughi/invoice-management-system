import type { ReactNode } from 'react';
import { AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export type PermissionNoticeProps = {
  message?: string;
  i18nKey?: string;
  tone?: 'warning' | 'info' | 'danger';
  compact?: boolean;
  className?: string;
  children?: ReactNode;
};

const toneStyles = {
  warning: {
    container: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: 'text-amber-600',
    Icon: AlertCircle
  },
  info: {
    container: 'border-sky-200 bg-sky-50 text-sky-900',
    icon: 'text-sky-600',
    Icon: Info
  },
  danger: {
    container: 'border-red-200 bg-red-50 text-red-900',
    icon: 'text-red-600',
    Icon: ShieldAlert
  }
};

export const PermissionNotice = ({
  message,
  i18nKey,
  tone = 'warning',
  compact = false,
  className,
  children
}: PermissionNoticeProps) => {
  const { t } = useTranslation('common');
  const styles = toneStyles[tone];
  const Icon = styles.Icon;
  const translatedMessage = i18nKey ? t(i18nKey) : undefined;
  const content = children ?? message ?? translatedMessage;

  if (content === undefined || content === null || content === '') return null;

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-md border text-sm leading-5',
        compact ? 'px-3 py-2' : 'px-4 py-3',
        styles.container,
        className
      )}>
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', styles.icon)} aria-hidden="true" />
      <div className="min-w-0 flex-1">{content}</div>
    </div>
  );
};
