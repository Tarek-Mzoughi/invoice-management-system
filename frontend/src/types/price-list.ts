import { PagedResponse } from './response';
import { DatabaseEntity } from './response/DatabaseEntity';

export interface PriceList extends DatabaseEntity {
  id?: number;
  name?: string;
  active?: boolean;
  cabinetId?: number;
}

export interface CreatePriceListDto extends Pick<PriceList, 'name' | 'active'> {}

export interface UpdatePriceListDto extends Pick<PriceList, 'id' | 'name' | 'active'> {}

export interface PagedPriceList extends PagedResponse<PriceList> {}
