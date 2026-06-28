import axios from './axios';
import { AppConfig, CreateAppConfigDto, UpdateAppConfigDto } from '@/types';

const find = async (keys?: string[]): Promise<AppConfig[]> => {
  const predicate = keys ? keys.map((key) => `key||$eq||${key}`).join('||$or||') : '';
  const response = await axios.get(`public/app-config/all?filter=${predicate}`);
  return response.data;
};

const findOne = async (id: number): Promise<AppConfig> => {
  const response = await axios.get(`public/app-config/${id}`);
  return response.data;
};

const create = async (createAppConfigDto: CreateAppConfigDto): Promise<AppConfig> => {
  const response = await axios.post<CreateAppConfigDto>('public/app-config', createAppConfigDto);
  return response.data;
};

const update = async (updateAppConfigDto: UpdateAppConfigDto): Promise<AppConfig> => {
  const response = await axios.put<UpdateAppConfigDto>(
    `public/app-config/${updateAppConfigDto.id}`,
    updateAppConfigDto
  );
  return response.data;
};

const remove = async (id: number) => {
  const { data, status } = await axios.delete<AppConfig>(`public/app-config/${id}`);
  return { data, status };
};

export const appConfig = { find, findOne, create, update, remove };
