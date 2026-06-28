import axios from './axios';
import { Country } from '@/types';

const find = async (): Promise<Country[]> => {
  const response = await axios.get('public/country/all');
  return response.data;
};

const findOne = async (id: number): Promise<Country> => {
  const response = await axios.get(`public/country/${id}`);
  return response.data;
};

export const country = { find, findOne };
