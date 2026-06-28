import { DatabaseEntity } from './response/DatabaseEntity';

export interface Permission extends DatabaseEntity {
  id?: string;
  label?: string;
  description?: string;
}
