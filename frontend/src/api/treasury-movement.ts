import axios from './axios';
import { CreateTreasuryMovementDto, PagedTreasuryMovement, TreasuryMovement } from '@/types';

const findPaginated = async (
  page: number = 1,
  size: number = 10,
  order: 'ASC' | 'DESC' = 'DESC',
  sortKey: string = 'movementDate',
  filters: string = ''
): Promise<PagedTreasuryMovement> => {
  let requestUrl = `public/treasury-movement/list?join=account,currency&limit=${size}&page=${page}`;

  if (sortKey) {
    requestUrl += `&sort=${sortKey},${order}`;
  }

  if (filters) {
    requestUrl += `&filter=${filters}`;
  }

  const response = await axios.get<PagedTreasuryMovement>(requestUrl);
  return response.data;
};

const findAll = async (filters: string = ''): Promise<TreasuryMovement[]> => {
  let requestUrl = 'public/treasury-movement/all?join=account,currency&sort=movementDate,DESC';
  if (filters) {
    requestUrl += `&filter=${filters}`;
  }
  const response = await axios.get<TreasuryMovement[]>(requestUrl);
  return response.data;
};

const findOneById = async (id: number): Promise<TreasuryMovement> => {
  const response = await axios.get<TreasuryMovement>(`public/treasury-movement/${id}?join=account,currency`);
  return response.data;
};

const create = async (movement: CreateTreasuryMovementDto): Promise<TreasuryMovement> => {
  const response = await axios.post<TreasuryMovement>('public/treasury-movement', movement);
  return response.data;
};

const remove = async (id: number) => {
  const { data, status } = await axios.delete<TreasuryMovement>(`public/treasury-movement/${id}`);
  return { data, status };
};

export const treasuryMovement = {
  findPaginated,
  findAll,
  findOneById,
  create,
  remove
};
