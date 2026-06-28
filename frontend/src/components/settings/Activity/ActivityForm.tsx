import React from 'react';
import { cn } from '@/lib/utils';
import { useActivityFormStructure } from './useActivityFormStructure';
import { FormBuilder } from '@/components/shared/form-builder/FormBuilder';

interface ActivityFormProps {
  className?: string;
}

export const ActivityForm = ({ className }: ActivityFormProps) => {
  const { activityFormStructure } = useActivityFormStructure();

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <FormBuilder structure={activityFormStructure} />
    </div>
  );
};
