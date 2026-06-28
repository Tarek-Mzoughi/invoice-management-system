import React from 'react';
import { cn } from '@/lib/utils';
import { useInterlocutorManager } from '../hooks/useInterlocutorManager';
import { useInterlocutorContactFormStructure } from './useInterlocutorContactFormStructure';
import { FormBuilder } from '@/components/shared/form-builder/FormBuilder';

interface InterlocutorContactInformationProps {
  className?: string;
  loading?: boolean;
}

export const InterlocutorContactInformation: React.FC<InterlocutorContactInformationProps> = ({
  className,
  loading
}) => {
  const interlocutorManager = useInterlocutorManager();
  const { interlocutorContactFormStructure } = useInterlocutorContactFormStructure({
    interlocutorManager,
    loading
  });

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <FormBuilder structure={interlocutorContactFormStructure} />
    </div>
  );
};
