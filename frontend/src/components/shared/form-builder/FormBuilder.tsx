import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FieldBuilder } from './FieldBuilder';
import { FieldVariant, FormStructure } from './types';

interface FormBuilderProps {
  className?: string;
  structure: FormStructure;
}

export const FormBuilder = ({ className, structure }: FormBuilderProps) => {
  const isStackedLayout = structure?.layout === 'stacked';

  return (
    <div className={cn('flex flex-col w-full', className)}>
      {!!structure?.includeHeader && (
        <div>
          <div className="space-y-1 py-5 sm:py-0">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{structure.title}</h1>
            <p className="text-muted-foreground">{structure.description}</p>
          </div>
          <Separator className="mt-2 mb-4 lg:mb-6" />
        </div>
      )}

      <form
        className={cn(
          'flex gap-4 xl:gap-10',
          structure?.orientation === 'vertical'
            ? isStackedLayout
              ? 'flex-col'
              : 'flex-col xl:flex-row'
            : 'flex-col'
        )}
        onSubmit={() => {
          return false;
        }}>
        {structure?.fieldsets?.map((fieldset, index) => (
          <div
            key={index}
            className={cn(
              'flex  w-full',
              structure.orientation === 'vertical'
                ? isStackedLayout
                  ? 'flex-col gap-6'
                  : 'flex-row xl:flex-col gap-10'
                : 'flex-col gap-5'
            )}>
            {fieldset.includeHeader && (
              <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold">{fieldset.title}</h2>
                <Separator />
              </div>
            )}

            {fieldset?.rows?.map((row, index) => {
              const visibleFields = row.fields.filter((f) => !f.hidden);
              if (visibleFields.length === 0) return null;

              const fieldCount = visibleFields.length;

              return (
                <div
                  key={index}
                  className={cn(
                    'grid gap-6 w-full',
                    row.className,
                    isStackedLayout
                      ? 'grid-cols-1'
                      : structure.orientation === 'vertical' || fieldCount === 1
                        ? 'grid-cols-1'
                        : fieldCount === 2
                          ? 'grid-cols-1 lg:grid-cols-2'
                          : fieldCount === 3
                            ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
                            : fieldCount === 4
                              ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
                              : 'w-full'
                  )}>
                  {visibleFields.map((field) => {
                    return (
                      <div
                        key={field.id}
                        className={cn('flex flex-col gap-1 w-full', field.wrapperClassName)}>
                        <Label className={cn('text-xs font-medium')} htmlFor={field.id}>
                          <span>{field.label}</span>
                          {field.required && <span className="text-red-500 mx-1">*</span>}
                        </Label>
                        <FieldBuilder field={field} />

                        <div className="flex justify-between items-center gap-2">
                          {![FieldVariant.SWITCH, FieldVariant.CHECKBOX].includes(
                            field.variant
                          ) &&
                            !field.error && (
                              <span className="font-medium text-xs opacity-70 leading-3">
                                {field.description}
                              </span>
                            )}
                          {field?.error && (
                            <span className="font-medium text-xs text-red-500 leading-3">
                              {field?.error}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </form>
    </div>
  );
};
