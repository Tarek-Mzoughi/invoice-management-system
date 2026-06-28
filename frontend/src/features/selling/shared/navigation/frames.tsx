import React from 'react';
import { cn } from '@/lib/utils';

interface SellingRouteFrameProps {
  children: React.ReactNode;
  className?: string;
}

export const SellingDocumentRouteFrame = ({ children, className }: SellingRouteFrameProps) => (
  <div className={cn('flex-1 flex flex-col overflow-hidden', className)}>{children}</div>
);

export const SellingPortalRouteFrame = ({ children, className }: SellingRouteFrameProps) => (
  <div className={cn('flex-1 flex flex-col overflow-hidden', className)}>{children}</div>
);
