import { CreatePriceListDto, PagedPriceList, PriceList, ToastValidation, UpdatePriceListDto } from '@/types';
import { QueryParams } from '@/types/response/QueryParams';
import axios from './axios';
import type { ApiRequestOptions } from './request-options';

const buildListFilter = (search: string = '') => {
  const trimmedSearch = search.trim();
  return trimmedSearch ? `name||$cont||${trimmedSearch}` : '';
};

const findPaginated = async ({
  page = 1,
  limit = 20,
  sort = 'name,ASC',
  filter
}: QueryParams): Promise<PagedPriceList> => {
  const response = await axios.get<PagedPriceList>('public/price-list/list', {
    params: {
      page,
      limit,
      sort,
      filter
    }
  });
  return response.data;
};

const find = async (options: ApiRequestOptions = {}): Promise<PriceList[]> => {
  const response = await axios.get<PriceList[]>('public/price-list/all', {
    params: {
      sort: 'name,ASC'
    },
    silentForbiddenToast: options.silentForbiddenToast
  });
  return response.data;
};

const create = async (priceList: CreatePriceListDto): Promise<PriceList> => {
  const response = await axios.post<PriceList>('public/price-list', priceList);
  return response.data;
};

const update = async (priceList: UpdatePriceListDto): Promise<PriceList> => {
  const response = await axios.put<PriceList>(`public/price-list/${priceList.id}`, priceList);
  return response.data;
};

const remove = async (id?: number) => {
  const { data, status } = await axios.delete<PriceList>(`public/price-list/${id}`);
  return { data, status };
};

const validate = (priceList: CreatePriceListDto | UpdatePriceListDto): ToastValidation => {
  if (!priceList.name?.trim() || priceList.name.trim().length < 2) {
    return { message: 'settings:price_lists.validation.name_required' };
  }
  return { message: '' };
};

export const priceList = { buildListFilter, findPaginated, find, create, update, remove, validate };
