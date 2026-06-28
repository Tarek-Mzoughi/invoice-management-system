import React from 'react';
import { cn } from '@/lib/utils';
import { useTaxWithholdingFormStructure } from './useTaxWithholdingFormStructure';
import { FormBuilder } from '@/components/shared/form-builder/FormBuilder';

interface TaxWithholdingFormProps {
  className?: string;
}

export const TaxWithholdingForm = ({ className }: TaxWithholdingFormProps) => {
  const { taxWithholdingFormStructure } = useTaxWithholdingFormStructure();

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <FormBuilder structure={taxWithholdingFormStructure} />
    </div>
  );
};
