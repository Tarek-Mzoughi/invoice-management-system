import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { CheckedState } from '@radix-ui/react-checkbox';
import { Field, SelectOption, RadioOption } from './types';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
import { ImageUploaderManager } from '@/components/shared/form-builder/ImageUploaderManager';
import { ImageUploader } from './ImageUploader';
import { PasswordField } from './PasswordField';
import { PhoneInput } from '@/components/ui/phone-input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface FieldBuilderProps {
  field?: Field<any>;
}

export const FieldBuilder = ({ field }: FieldBuilderProps) => {
  const { t } = useTranslation('common');

  switch (field?.variant) {
    case 'text':
    case 'email':
    case 'url':
      return (
        <Input
          className={cn(
            field?.className,
            field.error && 'border-destructive focus-visible:ring-destructive'
          )}
          type={field.variant}
          disabled={field.props?.disabled}
          placeholder={field.placeholder}
          value={field.props?.value}
          onChange={(event) => {
            field?.props?.onChange?.(event.target.value);
          }}
        />
      );
    case 'tel': {
      const rawValue = field.props?.value || '';
      const cleanValue = typeof rawValue === 'string' ? rawValue.replace(/[^\d+]/g, '') : rawValue;
      return (
        <PhoneInput
          className={cn(
            field?.className,
            field.error && 'border-destructive focus-visible:ring-destructive'
          )}
          defaultCountry="TN"
          placeholder={field.placeholder}
          value={cleanValue || undefined}
          onChange={(value) => {
            field?.props?.onChange?.(value);
          }}
          isPending={field?.props?.disabled}
        />
      );
    }
    case 'number':
      return (
        <Input
          className={cn(
            field?.className,
            field.error && 'border-destructive focus-visible:ring-destructive'
          )}
          type={field.variant}
          disabled={field.props?.disabled}
          min={field.props?.min}
          max={field.props?.max}
          value={field.props?.value}
          placeholder={field?.placeholder}
          onChange={(event) => {
            const inputValue = Number(event.target.value);
            const min = field.props?.min ?? -Infinity;
            const max = field.props?.max ?? Infinity;
            const clampedValue = Math.max(min, Math.min(max, inputValue));
            field?.props?.onChange?.(clampedValue);
          }}
        />
      );
    case 'select':
      return (
        <Select
          value={field?.props?.value || ''}
          onValueChange={field?.props?.onValueChange}
          disabled={field?.props?.disabled}
        >
          <SelectTrigger
            id={field.id}
            className={cn(
              'w-full',
              field?.className,
              field.error && 'border-destructive focus-visible:ring-destructive'
            )}
          >
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent className="overflow-y-auto max-h-[15rem]">
            {field?.props?.options?.map((option: SelectOption) => {
              return (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      );
    case 'date':
      return (
        <DatePicker
          className={cn(
            'w-full',
            field?.className,
            field.error && 'border-destructive focus-visible:ring-destructive'
          )}
          value={
            (field?.props?.value && new Date(field?.props?.value as string | Date | number)) ||
            undefined
          }
          onChange={(value: Date | null) => field?.props?.onDateChange?.(value)}
          placeholder={field.placeholder || t('pick_date')}
          isPending={field?.props?.disabled}
        />
      );
    case 'checkbox':
      return (
        <div className="flex items-center gap-2 h-8">
          <Checkbox
            {...field.props}
            id={field.id}
            checked={field?.props?.value}
            defaultChecked={field?.props?.defaultChecked}
            onCheckedChange={(value) => field?.props?.onCheckedChange?.(value)}
          />
          <Label className={cn('text-xs')} htmlFor={field.id}>
            {field.description}
          </Label>
        </div>
      );
    case 'radio':
      return (
        <RadioGroup
          value={field.props?.value}
          onValueChange={field.props?.onValueChange}
          disabled={field.props?.disabled}
          className={cn('flex flex-wrap gap-4', field.className)}
        >
          {field.props?.options?.map((option: RadioOption) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
              <Label htmlFor={`${field.id}-${option.value}`} className="text-xs font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );
    case 'password':
      return (
        <PasswordField
          {...field.props}
          className={cn(
            'pr-10',
            field.error && 'border-destructive focus-visible:ring-destructive',
            field?.className
          )}
          value={field?.props?.value as string}
          onChange={(e) => field?.props?.onChange?.(e.target.value)}
        />
      );
    case 'switch':
      return (
        <div className={cn('flex items-center gap-2', field?.className)}>
          <Switch
            {...field.props}
            id={field.id}
            checked={field?.props?.checked}
            defaultChecked={field?.props?.defaultChecked}
            onCheckedChange={(value) => field?.props?.onCheckedChange?.(value)}
          />{' '}
          <Label className="text-xs font-light">{field.description}</Label>
        </div>
      );
    case 'textarea':
      const { resizable, ...textareaProps } = field.props || {};
      return (
        <Textarea
          {...textareaProps}
          id={field.id}
          className={cn(!resizable && 'resize-none', field?.className)}
          placeholder={field.placeholder}
          value={field.props?.value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            field?.props?.onChange?.(e.target.value)
          }
        />
      );
    case 'file':
      return (
        <div className={cn('flex flex-col gap-2', field?.wrapperClassName)}>
          <Input
            {...field.props}
            id={field.id}
            type="file"
            accept={field.props?.accept}
            className={cn(
              'my-5 flex items-center',
              field?.className,
              field.error && 'border-destructive focus-visible:ring-destructive'
            )}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const file = e.target.files?.[0];
              if (file) {
                field?.props?.onFileChange?.(file);
                if (field.props?.onUpload) {
                  field.props.onUpload(file, (percent: number) => {
                    field.props.progress = percent;
                  });
                }
              }
            }}
          />
          {typeof field.props?.progress === 'number' && (
            <div className="space-y-1">
              <Progress value={field.props.progress} />
              <span className="text-xs text-muted-foreground text-center">
                {field.props.progress}%
              </span>
            </div>
          )}
        </div>
      );
    case 'image':
      return (
        <ImageUploader
          {...field.props}
          wrapperClassName={cn(field?.wrapperClassName)}
          className={cn('flex flex-col gap-2 items-center', field?.className)}
          id={field.id}
          image={field?.props?.image}
          fallback={field?.props?.fallback}
          disabled={field?.props?.disabled}
          accept={field?.props?.accept}
          onFileChange={(e: File) => field?.props?.onFileChange?.(e)}
          onUpload={(file, onProgress) => field?.props?.onUpload?.(file, onProgress)}
        />
      );

    case 'image_gallery':
      return <ImageUploaderManager {...field.props} />;

    case 'custom':
      return (
        <div className={cn('flex flex-col gap-2', field?.className)}>{field.props?.children}</div>
      );
    case 'empty':
      return null;
    default:
      return <span className="text-xs text-red-500">Cannot Render Element</span>;
  }
};
