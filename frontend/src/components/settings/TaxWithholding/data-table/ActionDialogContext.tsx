import { DataTableConfig } from '@/components/shared/data-table/types';
import { TaxWithholding } from '@/types';
import React from 'react';

export const TaxWithholdingActionsContext = React.createContext<DataTableConfig<TaxWithholding>>(
  {} as DataTableConfig<TaxWithholding>
);
