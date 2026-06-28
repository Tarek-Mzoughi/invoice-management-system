import axios from './axios';
import { isAlphabeticOrSpace, isEmail } from '@/utils/validations/string.validations';
import {
  CreateInterlocutorDto,
  Interlocutor,
  PagedInterlocutor,
  ToastValidation,
  UpdateInterlocutorDto
} from '@/types';
import { INTERLOCUTOR_FILTER_ATTRIBUTES } from '@/constants/interlocutor.filter-attributes';

const create = async (interlocutor: CreateInterlocutorDto): Promise<Interlocutor> => {
  const response = await axios.post<Interlocutor>('public/interlocutor', interlocutor);
  return response.data;
};

const factory = (): Interlocutor => {
  return {
    title: '',
    name: '',
    surname: '',
    email: '',
    phone: ''
  };
};

const findPaginated = async (
  page: number = 1,
  size: number = 5,
  order: 'ASC' | 'DESC' = 'ASC',
  sortKey: string = 'id',
  search: string = '',
  firmId: number = 0
): Promise<PagedInterlocutor> => {
  const queryFirm = firmId ? `firmsToInterlocutor.firmId||$eq||${firmId}` : '';
  const generalFilters = search
    ? Object.values(INTERLOCUTOR_FILTER_ATTRIBUTES)
        .map((key) => `${key}||$cont||${encodeURIComponent(search)}`)
        .join('||$or||')
    : '';

  let requestUrl = `public/interlocutor/list?limit=${size}&page=${page}&join=firmsToInterlocutor,firmsToInterlocutor.firm`;
  if (sortKey) {
    requestUrl += `&sort=firmsToInterlocutor.isMain,DESC;${sortKey},${order}`;
  }
  let combinedFilters = generalFilters;
  if (queryFirm) {
    combinedFilters = combinedFilters ? `${queryFirm};${combinedFilters}` : queryFirm;
  }
  if (combinedFilters) {
    requestUrl += `&filter=${combinedFilters}`;
  }
  const response = await axios.get<PagedInterlocutor>(requestUrl);
  return response.data;
};

const findOne = async (id: number): Promise<Interlocutor> => {
  const response = await axios.get<Interlocutor>(`public/interlocutor/${id}?columns[firm]`);
  return response.data;
};

const findAll = async (params: string = ''): Promise<Partial<Interlocutor>[]> => {
  const response = await axios.get<Partial<Interlocutor>[]>(`public/interlocutor/all?${params}`);
  return response.data;
};

const validate = (interlocutor: Partial<Interlocutor>): ToastValidation => {
  if (!interlocutor.title) return { message: 'interlocutor.errors.title_required' };
  if (!interlocutor.surname) return { message: 'interlocutor.errors.surname_required' };
  if (!isAlphabeticOrSpace(interlocutor.surname))
    return { message: 'interlocutor.errors.surname_alpha' };
  if (!interlocutor.name) return { message: 'interlocutor.errors.name_required' };
  if (!isAlphabeticOrSpace(interlocutor.name))
    return { message: 'interlocutor.errors.name_alpha' };
  // if (!interlocutor.email) return { message: 'Email est obligatoire' }
  if (!interlocutor.email)
    return { message: 'interlocutor.errors.email_recommended', type: 'warning' };
  if (!isEmail(interlocutor?.email || '')) return { message: 'interlocutor.errors.email_invalid' };
  if (!interlocutor.phone)
    return { message: 'interlocutor.errors.phone_recommended', type: 'warning' };
  return { message: '' };
};

const validateAssociations = (id?: number, position?: string): ToastValidation => {
  if (!id) return { message: "L'id est obligatoire" };
  if (!position) return { message: 'La position est obligatoire' };
  return { message: '' };
};

const update = async (interlocutor: UpdateInterlocutorDto): Promise<Interlocutor> => {
  const response = await axios.put<Interlocutor>(
    `public/interlocutor/${interlocutor.id}`,
    interlocutor
  );
  return response.data;
};

const promote = async (id?: number, firmId?: number): Promise<Interlocutor> => {
  const response = await axios.post<Interlocutor>(
    `public/interlocutor/promote/${id}/${firmId}`,
    {}
  );
  return response.data;
};

const remove = async (id?: number) => {
  const { data, status } = await axios.delete<Interlocutor>(`public/interlocutor/${id}`);
  return { data, status };
};

export const interlocutor = {
  create,
  factory,
  findPaginated,
  findOne,
  findAll,
  promote,
  update,
  remove,
  validate,
  validateAssociations
};
