import axios from './axios';
import { Currency } from '@/types';

const find = async (): Promise<Currency[]> => {
  const response = await axios.get('public/currency/all');
  return response.data;
};

const factory = (): Currency => {
  return {
    id: 0,
    code: '',
    label: '',
    symbol: '',
    digitAfterComma: 0
  };
};

export const currency = { factory, find };
