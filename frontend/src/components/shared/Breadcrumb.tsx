import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/router';

interface BreadcrumbItemType {
  title: string;
  href?: string;
}

interface BreadcrumbCommonProps {
  className?: string;
  hierarchy?: BreadcrumbItemType[];
}

export const BreadcrumbCommon = ({ className, hierarchy = [] }: BreadcrumbCommonProps) => {
  const router = useRouter();
  const lastIndex = hierarchy.length - 1;

  return (
    <Breadcrumb className={cn('my-auto', className)} aria-label="Breadcrumb">
      <BreadcrumbList className="flex flex-wrap items-center gap-1">
        {hierarchy.map((item, index) => {
          const isLast = index === lastIndex;

          return (
            <BreadcrumbItem key={index} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <BreadcrumbLink
                  className="text-xs font-semibold cursor-pointer"
                  onClick={() => router.push(item.href!)}>
                  {item.title}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="text-xs font-medium" aria-current="page">
                  {item.title}
                </BreadcrumbPage>
              )}

              {!isLast && <ChevronRight className="w-3 h-3 text-primary" />}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
