import React from 'react';

interface InterlocutorActionsContextProps {
  openCreateDialog?: () => void;
  openUpdateDialog?: () => void;
  openDeleteDialog?: () => void;
  openPromoteDialog?: () => void;
  openDisassociateDialog?: () => void;
  searchTerm?: string;
  setSearchTerm?: (value: string) => void;
  page?: number;
  totalPageCount?: number;
  setPage?: (value: number) => void;
  size?: number;
  setSize?: (value: number) => void;
  order?: boolean;
  sortKey?: string;
  setSortDetails?: (order: boolean, sortKey: string) => void;
  firmId?: number;
}

export const InterlocutorActionsContext = React.createContext<InterlocutorActionsContextProps>({});

export const useInterlocutorActions = () => React.useContext(InterlocutorActionsContext);
