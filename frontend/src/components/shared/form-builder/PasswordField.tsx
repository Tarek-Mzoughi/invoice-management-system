import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordFieldProps extends React.ComponentProps<'input'> {
  className?: string;
}

export const PasswordField = ({ className, placeholder, ...props }: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  return (
    <div className="grid gap-2 text-left">
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder || 'Enter password'}
          className="pr-10"
          autoComplete="new-password"
          {...props}
        />
        <Button
          type="button"
          onClick={togglePasswordVisibility}
          variant={'link'}
          className="absolute inset-y-0 right-0 flex items-center pr-3">
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </Button>
      </div>
    </div>
  );
};
