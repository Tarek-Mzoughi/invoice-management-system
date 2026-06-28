import { Permission } from '@/types/permission';
import { PagedResponse } from '@/types/response';
import axios from './axios';
import { PERMISSION_FILTER_ATTRIBUTES } from '@/constants/permission.filter-attributes';
import { PermissionMatrixResource } from '@/features/rbac/permissions';

const findPaginated = async (
  page: number = 1,
  size: number = 5,
  order: 'ASC' | 'DESC' = 'ASC',
  sortKey: string,
  search: string = '',
  relations: string[] = ['']
): Promise<PagedResponse<Permission>> => {
  const filter = search
    ? Object.values(PERMISSION_FILTER_ATTRIBUTES)
        .map((key) => `${key}||$cont||${search}`)
        .join('||$or||')
    : '';
  const response = await axios.get<PagedResponse<Permission>>(
    `/public/permission/list?filter=${filter}`,
    {
      params: {
        page,
        limit: size,
        sort: `${sortKey},${order}`,
        join: relations.join(',')
      }
    }
  );
  return response.data;
};

const findAll = async (): Promise<Permission[]> => {
  const response = await axios.get<Permission[]>(`/public/permission/all`);
  return response.data;
};

const findById = async (permissionId: string): Promise<Permission> => {
  const response = await axios.get<Permission>(`/public/permission/${permissionId}`);
  return response.data;
};

const findMatrix = async (): Promise<PermissionMatrixResource[]> => {
  const response = await axios.get<PermissionMatrixResource[]>(`/public/permission/matrix`);
  return response.data;
};

const create = async (Permission: Partial<Permission>): Promise<Permission> => {
  const response = await axios.post<Permission>('/public/permission/', Permission);
  return response.data;
};

const update = async (
  permissionId: string,
  Permission: Partial<Permission>
): Promise<Permission> => {
  const response = await axios.put<Permission>(`/public/permission/${permissionId}`, Permission);
  return response.data;
};

const remove = async (permissionId: string): Promise<void> => {
  await axios.delete(`/public/permission/${permissionId}`);
};

export const permission = {
  // Permissions
  findMatrix,
  findPaginated,
  findAll,
  findById,
  create,
  update,
  remove
};
