import React from 'react';

export interface TaxActionsContextProps {
  openCreateTaxSheet: () => void;
  openUpdateTaxSheet: () => void;
  openDeleteTaxDialog: () => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  page: number;
  totalPageCount: number;
  setPage: (value: number) => void;
  size: number;
  setSize: (value: number) => void;
  order: boolean;
  sortKey: string;
  setSortDetails: (order: boolean, sortKey: string) => void;
}

export const TaxActionsContext = React.createContext<TaxActionsContextProps>({
  openCreateTaxSheet: () => {},
  openUpdateTaxSheet: () => {},
  openDeleteTaxDialog: () => {},
  searchTerm: '',
  setSearchTerm: (_value: string) => {},
  page: 1,
  totalPageCount: 1,
  setPage: (_value: number) => {},
  size: 1,
  setSize: (_value: number) => {},
  order: true,
  sortKey: '',
  setSortDetails: (_order: boolean, _sortKey: string) => {}
});

export const useTaxActions = () => React.useContext(TaxActionsContext);
