interface DataTableRowAdditionalAction<T> {
  actionCallback?: (entity: T) => void;
  actionLabel: string;
  actionIcon: React.ReactNode;
  isActionVisible?: (entity: T) => boolean;
}

export interface DataTableBulkAction<T> {
  actionCallback: (entities: T[]) => void;
  actionLabel: string;
  actionIcon?: React.ReactNode;
  isActionVisible?: (entities: T[]) => boolean;
}

export interface DataTableConfig<T> {
  singularName: string;
  pluralName: string;
  showViewOptions?: boolean;
  //pagination
  page: number;
  size: number;
  totalPageCount: number;
  setPage: (page: number) => void;
  setSize: (size: number) => void;
  //sorting
  order?: boolean;
  sortKey?: string;
  setSortDetails?: (order: boolean, sortKey: string) => void;
  //filtering
  searchTerm?: string;
  setSearchTerm?: (searchTerm: string) => void;
  //actions
  createCallback?: () => void;
  inspectCallback?: (entity: T) => void;
  updateCallback?: (entity: T) => void;
  isUpdateVisible?: (entity: T) => boolean;
  deleteCallback?: (entity: T) => void;
  isDeleteVisible?: (entity: T) => boolean;
  additionalActions?: Record<number, DataTableRowAdditionalAction<T>[]>;
  bulkActions?: DataTableBulkAction<T>[];
  //utility
  targetEntity?: (entity: T) => void;
  invisibleColumns?: string[];
}


export enum DataTableCellVariant {
  AVATAR = 'avatar',
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  DATE_TIME = 'date-time',
  CURRENCY = 'currency',
  EMAIL = 'email',
  PHONE = 'phone'
}
