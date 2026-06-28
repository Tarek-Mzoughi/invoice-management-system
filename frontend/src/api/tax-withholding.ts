import { TAX_FILTER_ATTRIBUTES } from '@/constants/tax.filter-attributes';
import axios from './axios';
import type { ApiRequestOptions } from './request-options';
import {
  CreateTaxWithholdingDto,
  PagedTaxWithholding,
  TaxWithholding,
  ToastValidation,
  UpdateTaxWithholdingDto
} from '@/types';

const factory = (): TaxWithholding => {
  return {
    label: '',
    rate: 0
  };
};

const findPaginated = async (
  page: number = 1,
  size: number = 5,
  order: 'ASC' | 'DESC' = 'ASC',
  sortKey: string = 'id',
  search: string = ''
): Promise<PagedTaxWithholding> => {
  const generalFilters = search
    ? Object.values(TAX_FILTER_ATTRIBUTES)
        .map((key) => `${key}||$cont||${search}`)
        .join('||$or||')
    : '';

  const response = await axios.get<PagedTaxWithholding>(
    `public/tax-withholding/list?sort=${sortKey},${order}&filter=${generalFilters}&limit=${size}&page=${page}`
  );
  return response.data;
};

const find = async (options: ApiRequestOptions = {}): Promise<TaxWithholding[]> => {
  const response = await axios.get<TaxWithholding[]>(`public/tax-withholding/all`, {
    silentForbiddenToast: options.silentForbiddenToast
  });
  return response.data;
};

const create = async (tax: CreateTaxWithholdingDto): Promise<TaxWithholding> => {
  const response = await axios.post<TaxWithholding>('public/tax-withholding', tax);
  return response.data;
};

const update = async (tax: UpdateTaxWithholdingDto): Promise<TaxWithholding> => {
  const response = await axios.put<TaxWithholding>(`public/tax-withholding/${tax.id}`, tax);
  return response.data;
};

const remove = async (id: number) => {
  const { data, status } = await axios.delete<TaxWithholding>(`public/tax-withholding/${id}`);
  return { data, status };
};

const validate = (tax: CreateTaxWithholdingDto | UpdateTaxWithholdingDto): ToastValidation => {
  const { label, rate } = tax;

  if (!label || label.length < 3) {
    return { message: 'Veuillez entrer un titre valide' };
  }
  if (rate && (rate <= 0 || rate > 99)) {
    return {
      message: 'Veuillez entrer un taux valide (entre 0 et 99% pour un taux en pourcentage)'
    };
  }

  return { message: '' };
};

export const taxWithholding = { factory, findPaginated, find, create, update, remove, validate };
