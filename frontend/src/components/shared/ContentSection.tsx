import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

interface ContentSectionProps {
  className?: string;
  childrenClassName?: string;
  title: string;
  desc: string;
  children?: JSX.Element;
}

export default function ContentSection({
  className,
  childrenClassName,
  title,
  desc,
  children
}: ContentSectionProps) {
  return (
    <div className={cn('flex flex-col overflow-hidden', className)}>
      <div className="flex-none">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <Separator className="my-4 flex-none" />
      {children && (
        <div
          className={cn(
            'faded-bottom -mx-4 flex flex-col flex-1 px-4 md:pb-10',
            childrenClassName
          )}>
          {children}
        </div>
      )}
    </div>
  );
}
