import axios from './axios';
import { CreateTaxDto, PagedTax, Tax, ToastValidation, UpdateTaxDto } from '@/types';
import { QueryParams } from '@/types/response/QueryParams';
import type { ApiRequestOptions } from './request-options';

interface TaxRequestOptions extends ApiRequestOptions {
  activeOnly?: boolean;
}

const findPaginated = async ({
  page,
  limit,
  sort,
  filter,
  join = 'currency'
}: QueryParams): Promise<PagedTax> => {
  const response = await axios.get<PagedTax>(`public/tax/list`, {
    params: {
      page,
      limit,
      sort,
      filter,
      join
    }
  });
  return response.data;
};

const find = async (options: TaxRequestOptions = {}): Promise<Tax[]> => {
  const response = await axios.get<Tax[]>(`public/tax/all`, {
    params: {
      activeOnly: options.activeOnly
    },
    silentForbiddenToast: options.silentForbiddenToast
  });
  return response.data;
};

const findTemplates = async (): Promise<Tax[]> => {
  const response = await axios.get<Tax[]>('public/tax/templates', {
    skipCabinetHeader: true
  });
  return response.data;
};

const create = async (tax: CreateTaxDto): Promise<Tax> => {
  const response = await axios.post<Tax>('public/tax', tax);
  return response.data;
};

const update = async (tax: UpdateTaxDto): Promise<Tax> => {
  const response = await axios.put<Tax>(`public/tax/${tax.id}`, tax);
  return response.data;
};

const remove = async (id?: number) => {
  const { data, status } = await axios.delete<Tax>(`public/tax/${id}`);
  return { data, status };
};

const validate = (tax: CreateTaxDto | UpdateTaxDto): ToastValidation => {
  const { label, isRate, value } = tax;

  if (!label || label.length < 3) {
    return { message: 'Veuillez entrer un titre valide' };
  }
  if (isRate && typeof value === 'number' && (value < 0 || value > 99)) {
    return {
      message: 'Veuillez entrer une valeur valide (entre 0 et 99% pour un taux en pourcentage)'
    };
  }
  return { message: '' };
};

export const tax = { findPaginated, find, findTemplates, create, update, remove, validate };
