import React from 'react';

export const UserActionsContext = React.createContext({
  openCreateUserSheet: () => {},
  openUpdateUserSheet: () => {},
  openActivateUserDialog: () => {},
  openDeactivateUserDialog: () => {},
  // openDeleteUserDialog: () => {},
  // openDuplicateUserDialog: () => {},
  searchTerm: '',
  setSearchTerm: (_value: string) => {},
  page: 1,
  totalPageCount: 0,
  setPage: (_value: number) => {},
  size: 1,
  setSize: (_value: number) => {},
  order: true,
  sortKey: '',
  setSortDetails: (_order: boolean, _sortKey: string) => {}
});
export const useUserActions = () => React.useContext(UserActionsContext);
