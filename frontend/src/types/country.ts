import { DatabaseEntity } from './response/DatabaseEntity';

export interface Country extends DatabaseEntity {
  id?: number;
  alpha2Code?: string;
  alpha3Code?: string;
}
