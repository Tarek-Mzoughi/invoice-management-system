import React from 'react';
import { cn } from '@/lib/utils';
import { DateFormat } from '@/types/enums/date-formats';
import { format } from 'date-fns';
import { Input } from '../ui/input';

interface SequenceInputProps {
  className?: string;
  prefix?: string;
  dateFormat?: DateFormat;
  value?: number;
}

export const SequenceInput: React.FC<SequenceInputProps> = ({
  className,
  prefix,
  dateFormat,
  value
}) => {
  const date = dateFormat ? format(new Date(), dateFormat.toLocaleLowerCase()) : '';
  return (
    <div className={cn('flex gap-2 items-center justify-center', className)}>
      <Input
        className="text-muted-foreground focus-visible:ring-transparent disabled:cursor-auto w-1/3"
        value={`${prefix} -`}
        disabled
      />
      <Input
        className="text-muted-foreground focus-visible:ring-transparent disabled:cursor-auto w-1/3"
        value={`${date} -`}
        disabled
      />
      <Input
        className="text-muted-foreground focus-visible:ring-transparent disabled:cursor-auto w-1/3"
        value={value}
        disabled
      />
    </div>
  );
};
