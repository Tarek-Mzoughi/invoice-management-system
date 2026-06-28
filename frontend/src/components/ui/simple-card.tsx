import { cn } from '@/lib/utils';

const Line = ({ className = '' }) => (
  <div
    className={cn(
      'h-px w-full via-zinc-400 from-[1%] from-zinc-200 to-zinc-600 absolute -z-0 dark:via-zinc-700 dark:from-zinc-900 dark:to-zinc-500',
      className
    )}
  />
);

export const SimpleCard = ({
  children = undefined,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={'relative mx-auto w-full px-4 sm:px-6 md:px-8'}>
      <Line className="bg-gradient-to-l left-0 top-2 sm:top-4 md:top-6" />
      <Line className="bg-gradient-to-r bottom-2 sm:bottom-4 md:bottom-6 left-0" />

      <Line className="w-px bg-gradient-to-t right-2 sm:right-4 md:right-6 h-full inset-y-0" />
      <Line className="w-px bg-gradient-to-t left-2 sm:left-4 md:left-6 h-full inset-y-0" />
      <div className="relative z-20 mx-auto py-8">
        <div className={cn('p-4 rounded w-full text-center', className)}>{children}</div>
      </div>
    </div>
  );
};
