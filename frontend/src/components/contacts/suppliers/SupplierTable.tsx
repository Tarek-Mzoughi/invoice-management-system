import React from 'react';
import type { Firm } from '@/types';
import { FirmTable } from '@/components/contacts/shared/FirmTable';
import { SupplierTableRow } from './SupplierTableRow';

interface SupplierTableProps {
  disabled?: boolean;
  emptyLabel: string;
  firms: Firm[];
  isPending?: boolean;
  onDeleteRequest: (firm: Firm) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  page: number;
  size: number;
  totalPageCount: number;
  totalResultCount: number;
}

export function SupplierTable({
  disabled,
  emptyLabel,
  firms,
  isPending,
  onDeleteRequest,
  onPageChange,
  onPageSizeChange,
  page,
  size,
  totalPageCount,
  totalResultCount
}: SupplierTableProps) {
  return (
    <FirmTable
      emptyLabel={emptyLabel}
      firms={firms}
      isPending={isPending}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      page={page}
      renderRow={(firm) => (
        <SupplierTableRow disabled={disabled} firm={firm} onDeleteRequest={onDeleteRequest} />
      )}
      size={size}
      totalPageCount={totalPageCount}
      totalResultCount={totalResultCount}
    />
  );
}

