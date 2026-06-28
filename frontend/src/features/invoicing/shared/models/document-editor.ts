import type { ButtonProps } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

export interface DocumentEditorActionModel {
  id: string;
  label: React.ReactNode;
  icon?: LucideIcon;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
}
