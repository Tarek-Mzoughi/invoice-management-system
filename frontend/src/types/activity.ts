import { PagedResponse } from './response';
import { DatabaseEntity } from './response/DatabaseEntity';

export interface Activity extends DatabaseEntity {
  id?: number;
  label?: string;
}

export interface CreateActivityDto extends Pick<Activity, 'label' | 'isDeletionRestricted'> {}
export interface UpdateActivityDto
  extends Pick<Activity, 'label' | 'id' | 'isDeletionRestricted'> {}
export interface PagedActivity extends PagedResponse<Activity> {}
