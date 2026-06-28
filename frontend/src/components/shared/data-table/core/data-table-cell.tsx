import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import React from 'react';
import { DataTableCellVariant } from '../types';

type AvatarCellValue = {
  fallback?: React.ReactNode;
  url?: string;
};

type DataTableCellValue = React.ReactNode | Date | AvatarCellValue;

interface DataTableCellProps {
  className?: string;
  value?: DataTableCellValue;
  variant?: DataTableCellVariant;
}

const isAvatarCellValue = (value: DataTableCellValue): value is AvatarCellValue =>
  typeof value === 'object' &&
  value !== null &&
  !React.isValidElement(value) &&
  !(value instanceof Date) &&
  ('url' in value || 'fallback' in value);

const renderCellValue = (value: DataTableCellValue) => {
  if (value instanceof Date || isAvatarCellValue(value)) return null;
  return value;
};

export default function DataTableCell({ className, variant, value }: DataTableCellProps) {
  if (variant === DataTableCellVariant.TEXT) {
    return <div className={className}>{renderCellValue(value)}</div>;
  } else if (variant === DataTableCellVariant.NUMBER) {
    return <div className={className}>{renderCellValue(value)}</div>;
  } else if (variant === DataTableCellVariant.DATE) {
    return (
      <div className={className}>
        {value instanceof Date ? value.toLocaleDateString() : renderCellValue(value)}
      </div>
    );
  } else if (variant === DataTableCellVariant.DATE_TIME) {
    if (!(value instanceof Date)) return <div className={className}>No Date</div>;
    return (
      <div className="flex items-start flex-col">
        <div>{value.toLocaleDateString()}</div>
        <div className="text-muted-foreground">{value.toLocaleTimeString()}</div>
      </div>
    );
  } else if (variant === DataTableCellVariant.AVATAR) {
    const avatarValue = isAvatarCellValue(value) ? value : undefined;

    return (
      <Avatar className={cn('w-24 h-24', className)}>
        <AvatarImage src={avatarValue?.url} />
        <AvatarFallback>{avatarValue?.fallback}</AvatarFallback>
      </Avatar>
    );
  }
}
