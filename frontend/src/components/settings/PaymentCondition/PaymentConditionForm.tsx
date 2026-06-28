import React from 'react';
import { cn } from '@/lib/utils';
import { usePaymentConditionFormStructure } from './usePaymentConditionFormStructure';
import { FormBuilder } from '@/components/shared/form-builder/FormBuilder';

interface PaymentConditionFormProps {
  className?: string;
}

export const PaymentConditionForm = ({ className }: PaymentConditionFormProps) => {
  const { paymentConditionFormStructure } = usePaymentConditionFormStructure();

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <FormBuilder structure={paymentConditionFormStructure} />
    </div>
  );
};
