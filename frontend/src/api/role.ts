import { PagedResponse } from '@/types/response';
import axios from './axios';
import { CreateRoleDto, Role, UpdateRoleDto } from '@/types';
import { ROLE_FILTER_ATTRIBUTES } from '@/constants/role.filter-attributes';

const findPaginated = async (
  page: number = 1,
  size: number = 5,
  order: 'ASC' | 'DESC' = 'ASC',
  sortKey: string,
  search: string = '',
  relations: string[] = ['permissions', 'permissions.permission']
): Promise<PagedResponse<Role>> => {
  const filter = search
    ? Object.values(ROLE_FILTER_ATTRIBUTES)
        .map((key) => `${key}||$cont||${search}`)
        .join('||$or||')
    : '';
  const response = await axios.get<PagedResponse<Role>>(`public/role/list?filter=${filter}`, {
    params: {
      page,
      limit: size,
      sort: `${sortKey},${order}`,
      join: relations.join(',')
    }
  });
  return response.data;
};

const findAll = async (): Promise<Role[]> => {
  const response = await axios.get<Role[]>(`public/role/all`);
  return response.data;
};

const findById = async (id?: string): Promise<Role> => {
  const response = await axios.get<Role>(`public/role/${id}`);
  return response.data;
};

const create = async (createRoleDto: CreateRoleDto): Promise<Role> => {
  const response = await axios.post<Role>('public/role', createRoleDto);
  return response.data;
};

const duplicate = async (id?: string): Promise<Role> => {
  const response = await axios.post<Role>(`public/role/duplicate/${id}`);
  return response.data;
};

const update = async (id?: string, updateRoleDto?: UpdateRoleDto): Promise<Role> => {
  const response = await axios.put<Role>(`public/role/${id}`, updateRoleDto);
  return response.data;
};

const remove = async (id?: string): Promise<void> => {
  await axios.delete(`public/role/${id}`);
};

export const role = {
  findPaginated,
  findAll,
  findById,
  create,
  duplicate,
  update,
  remove
};
