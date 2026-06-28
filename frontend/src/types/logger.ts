import { EVENT_TYPE } from './enums/event-types';
import { PagedResponse } from './response';
import { ResponseUserDto as User } from './user';

export interface Log {
  id?: number;
  event?: EVENT_TYPE;
  api?: string;
  method?: string;
  user?: User;
  userId?: number;
  logInfo?: any;
  loggedAt?: string;
}

export interface PagedLogs extends PagedResponse<Log> {}
