import packageJson from 'package.json';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AppVersionProps {
  className?: string;
}

export const AppVersion = ({ className }: AppVersionProps) => {
  return (
    <div className={cn('truncate', className)}>
      <Label className="text-xs">V{packageJson.version}</Label>
    </div>
  );
};
