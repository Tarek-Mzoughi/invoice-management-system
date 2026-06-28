import React from 'react';

export interface LoggerActionsContextProps {
  startDate?: Date;
  endDate?: Date;
  setStartDate?: (date: Date | undefined) => void;
  setEndDate?: (date: Date | undefined) => void;
  events?: string[];
  setEvents?: (events: string[]) => void;
  order?: boolean;
  sortKey?: string;
  setSortDetails?: (order: boolean, sortKey: string) => void;
  newLogsCount?: number;
  setNewLogsCount?: (value: number) => void;
  toggleConnection?: () => void;
  isConnected?: boolean;
}

export const LoggerActionsContext = React.createContext<LoggerActionsContextProps>({});

export const useLoggerActions = () => React.useContext(LoggerActionsContext);
