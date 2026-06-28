import { DatabaseEntity } from './response/DatabaseEntity';

export interface AppConfig<T = any> extends DatabaseEntity {
  id?: number;
  key?: string;
  value?: T;
}

export interface CreateAppConfigDto
  extends Omit<
    AppConfig,
    'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'isDeletionRestricted'
  > {}
export interface UpdateAppConfigDto extends Omit<CreateAppConfigDto, 'name'> {
  id: number;
}
