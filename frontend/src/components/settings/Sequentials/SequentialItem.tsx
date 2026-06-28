import { DateFormat } from '@/types/enums/date-formats';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UpdateSequentialDto } from '@/types';

interface SequentialItemProps {
  className?: string;
  id?: number;
  title: string;
  prefix?: string;
  dateFormat?: DateFormat;
  nextNumber?: number;
  loading?: boolean;
  onSequenceChange?: (fieldname: keyof UpdateSequentialDto, value: any) => void;
}

export const SequentialItem: React.FC<SequentialItemProps> = ({
  className,
  title,
  prefix,
  dateFormat,
  nextNumber,
  loading,
  onSequenceChange
}) => {
  const { t: tSettings } = useTranslation('settings');

  const sequenceOptions = {
    [DateFormat.YYYY]: 'yyyy',
    [DateFormat.YYMM]: 'yy-MM',
    [DateFormat.YYYYMM]: 'yyyy-MM'
  };

  return (
    <Card className={cn('border border-border/80 bg-card shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 rounded-xl overflow-hidden', className)}>
      <CardHeader className="border-b border-border/50 bg-accent/5 px-5 py-4">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <div className="h-3 w-1 rounded-full bg-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{tSettings('sequence.attributes.prefix')}</Label>
          <Input
            value={prefix || ''}
            disabled={loading}
            className="h-10 rounded-lg focus-visible:ring-primary/20 transition-all"
            onChange={(e) => {
              onSequenceChange?.('prefix', e.target.value);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {tSettings('sequence.attributes.dynamic_sequence')}
          </Label>
          <Select
            value={dateFormat || DateFormat.YYYY}
            disabled={loading}
            onValueChange={(value) => {
              onSequenceChange?.('dateFormat', value as DateFormat);
            }}>
            <SelectTrigger className="h-10 rounded-lg focus:ring-primary/20 transition-all">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sequenceOptions).map(([key, value]) => (
                <SelectItem key={key} value={key} className="rounded-md">
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{tSettings('sequence.attributes.next')}</Label>
          <Input
            type="number"
            value={nextNumber ?? ''}
            disabled={loading}
            className="h-10 rounded-lg focus-visible:ring-primary/20 transition-all"
            onChange={(e) => {
              onSequenceChange?.('next', parseInt(e.target.value));
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
