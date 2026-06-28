import React from 'react';
import { useTaxManager } from './hooks/useTaxManager';
import useCurrency from '@/hooks/content/useCurrency';
import { cn } from '@/lib/utils';
import { useTaxFormStructure } from './useTaxFormStructure';
import { FormBuilder } from '@/components/shared/form-builder/FormBuilder';

interface TaxFormProps {
  className?: string;
}

export const TaxForm = ({ className }: TaxFormProps) => {
  const { currencies, isFetchCurrenciesPending } = useCurrency();
  const taxManager = useTaxManager();
  const { taxFormStructure } = useTaxFormStructure({ store: taxManager, currencies });

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <FormBuilder structure={taxFormStructure} />
    </div>
  );
};
