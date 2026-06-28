import { ResponseSequenceDto, UpdateSequentialDto } from '@/types';
import axios from './axios';
import type { ApiRequestOptions } from './request-options';

const findAll = async (): Promise<ResponseSequenceDto[]> => {
  const response = await axios.get<ResponseSequenceDto[]>(`/public/sequence/all`);
  return response.data;
};

const findById = async (id: string): Promise<ResponseSequenceDto> => {
  const response = await axios.get<ResponseSequenceDto>(`/public/sequence/${id}`);
  return response.data;
};

const findByLabel = async (
  label: string,
  options: ApiRequestOptions = {}
): Promise<ResponseSequenceDto> => {
  const response = await axios.get<ResponseSequenceDto>(`/public/sequence/label/${label}`, {
    silentForbiddenToast: options.silentForbiddenToast
  });
  return response.data;
};

const update = async (
  id: number,
  updateSequenceDto: UpdateSequentialDto
): Promise<ResponseSequenceDto> => {
  const response = await axios.put<ResponseSequenceDto>(`/public/sequence/${id}`, updateSequenceDto);
  return response.data;
};

export const sequence = { findAll, findById, findByLabel, update };
