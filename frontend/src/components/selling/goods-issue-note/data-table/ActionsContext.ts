import React from 'react';

interface GoodsIssueNoteActionsContextProps {
  openDeleteDialog?: () => void;
  openDuplicateDialog?: () => void;
  openDownloadDialog?: () => void;
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
  interlocutorId?: number;
}

export const GoodsIssueNoteActionsContext = React.createContext<GoodsIssueNoteActionsContextProps>(
  {}
);

export const useGoodsIssueNoteActions = () => React.useContext(GoodsIssueNoteActionsContext);
