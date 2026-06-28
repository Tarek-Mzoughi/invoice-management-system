import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useRouter } from 'next/router';

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
    icon: JSX.Element;
  }[];
}

export default function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const router = useRouter();
  const [val, setVal] = useState(router.pathname ?? '/settings');

  const handleSelect = (e: string) => {
    setVal(e);
    router.push(e);
  };
  return (
    <>
      <div className="md:hidden p-1">
        <Select value={val} onValueChange={handleSelect}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.href} value={item.href}>
                <div className="flex gap-x-4 px-2 py-1">
                  <span className="scale-125">{item.icon}</span>
                  <span className="text-md">{item.title}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="hidden w-full overflow-x-auto bg-background py-2 md:block">
        <nav
          className={cn('flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1', className)}
          {...props}>
          {items.map((item) => {
            const isActive = router.asPath === item.href;
            return (
              <Button
                variant={'ghost'}
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  'w-full justify-start h-10 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2',
                  isActive
                    ? 'bg-primary/10 text-primary hover:bg-primary/15 font-semibold border-l-2 border-primary rounded-l-none'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}>
                <span className={cn('transition-transform duration-200', isActive && 'scale-105')}>{item.icon}</span>
                {item.title}
              </Button>
            );
          })}
        </nav>
      </div>
    </>
  );
}

