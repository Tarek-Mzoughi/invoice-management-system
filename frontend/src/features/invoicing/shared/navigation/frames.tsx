import React from 'react';
import { cn } from '@/lib/utils';

interface InvoicingRouteFrameProps {
  children: React.ReactNode;
  className?: string;
}

export const InvoicingDocumentRouteFrame = ({ children, className }: InvoicingRouteFrameProps) => (
  <div className={cn('flex-1 flex flex-col overflow-hidden', className)}>{children}</div>
);

export const InvoicingPortalRouteFrame = ({ children, className }: InvoicingRouteFrameProps) => (
  <div className={cn('flex-1 flex flex-col overflow-hidden', className)}>{children}</div>
);
