import { PagedResponse } from './response';
import { DatabaseEntity } from './response/DatabaseEntity';

export interface TaxWithholding extends DatabaseEntity {
  id?: number;
  label?: string;
  rate?: number;
}

export interface CreateTaxWithholdingDto
  extends Omit<TaxWithholding, 'createdAt' | 'updatedAt' | 'deletedAt' | 'isDeletionRestricted'> {}
export interface UpdateTaxWithholdingDto extends CreateTaxWithholdingDto {
  id?: number;
}
export interface PagedTaxWithholding extends PagedResponse<CreateTaxWithholdingDto> {}
