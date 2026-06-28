import React from 'react';
import { cn } from '@/lib/utils';
import { useUserManager } from './hooks/useUserManager';
import { Role } from '@/types/role';
import { CheckedState } from '@radix-ui/react-checkbox';
import { useUserFormStructure } from './useUserFormStructure';
import { FormBuilder } from '@/components/shared/form-builder/FormBuilder';

interface UserFormProps {
  className?: string;
  roles?: Role[];
  forceShowPasswordInputs?: boolean;
  loading?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  className,
  roles,
  forceShowPasswordInputs = true,
  loading
}) => {
  const userManager = useUserManager();
  const [showPasswordInputs, setShowPasswordInputs] = React.useState(false);

  const handleShowPasswordInputs = (checked: CheckedState) => {
    const isChecked = checked as boolean;
    const value = isChecked ? '' : undefined;
    setShowPasswordInputs(isChecked);
    userManager.set('password', value);
    userManager.set('confirmPassword', value);
  };

  const { userFormStructure } = useUserFormStructure({
    userManager,
    roles,
    forceShowPasswordInputs,
    showPasswordInputs,
    handleShowPasswordInputs,
    loading
  });

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <FormBuilder structure={userFormStructure} />
    </div>
  );
};
