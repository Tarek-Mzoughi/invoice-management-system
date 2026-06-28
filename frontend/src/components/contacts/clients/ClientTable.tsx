import React from 'react';
import type { Firm } from '@/types';
import { FirmTable } from '@/components/contacts/shared/FirmTable';
import { ClientTableRow } from './ClientTableRow';

interface ClientTableProps {
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

export function ClientTable({
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
}: ClientTableProps) {
  return (
    <FirmTable
      emptyLabel={emptyLabel}
      firms={firms}
      isPending={isPending}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      page={page}
      renderRow={(firm) => (
        <ClientTableRow disabled={disabled} firm={firm} onDeleteRequest={onDeleteRequest} />
      )}
      size={size}
      totalPageCount={totalPageCount}
      totalResultCount={totalResultCount}
    />
  );
}

