import React from 'react';
import { useBankAccountFormStructure } from './useBankAccountFormStructure';
import { FormBuilder } from '@/components/shared/form-builder/FormBuilder';
import { cn } from '@/lib/utils';

interface BankAccountFormProps {
  className?: string;
  mainByDefault?: boolean;
}

export const BankAccountForm = ({ className, mainByDefault }: BankAccountFormProps) => {
  const { bankAccountFormStructure } = useBankAccountFormStructure(mainByDefault);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <FormBuilder structure={bankAccountFormStructure} />
    </div>
  );
};
