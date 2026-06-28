import { useFooter } from '@/context/FooterContext';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

export const Footer = ({ className }: FooterProps) => {
  const { content } = useFooter();
  return (
    <footer className={cn('flex flex-col gap-2 p-2 text-xs lg:text-sm w-full', className)}>
      {content}
    </footer>
  );
};
