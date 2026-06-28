import axios from '@/api/axios';
import {
  DashboardActivity,
  DashboardFilters,
  DashboardGlobal,
  DashboardOverview,
  DashboardPayments,
  DashboardPurchases,
  DashboardReferentials,
  DashboardSales,
  DashboardTreasury,
  DashboardWithholding
} from '../types/dashboard.types';

const buildParams = (filters: DashboardFilters) => {
  const params = new URLSearchParams({
    period: filters.period,
    documentType: filters.documentType,
    topLimit: String(filters.topLimit ?? 5)
  });

  if (filters.period === 'custom') {
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
  }

  if (filters.clientId) params.set('clientId', String(filters.clientId));
  if (filters.supplierId) params.set('supplierId', String(filters.supplierId));
  if (filters.currencyId) params.set('currencyId', String(filters.currencyId));

  return params;
};

const fetchDashboard = async <T>(endpoint: string, filters: DashboardFilters): Promise<T> => {
  const params = buildParams(filters);
  const response = await axios.get<T>(`public/dashboard/${endpoint}?${params.toString()}`);
  return response.data;
};

/** Legacy — kept for backward compatibility */
const getOverview = (filters: DashboardFilters) =>
  fetchDashboard<DashboardOverview>('overview', filters);

const getGlobal = (filters: DashboardFilters) =>
  fetchDashboard<DashboardGlobal>('global', filters);

const getSales = (filters: DashboardFilters) =>
  fetchDashboard<DashboardSales>('sales', filters);

const getPurchases = (filters: DashboardFilters) =>
  fetchDashboard<DashboardPurchases>('purchases', filters);

const getPayments = (filters: DashboardFilters) =>
  fetchDashboard<DashboardPayments>('payments', filters);

const getTreasury = (filters: DashboardFilters) =>
  fetchDashboard<DashboardTreasury>('treasury', filters);

const getWithholding = (filters: DashboardFilters) =>
  fetchDashboard<DashboardWithholding>('withholding', filters);

const getReferentials = (filters: DashboardFilters) =>
  fetchDashboard<DashboardReferentials>('referentials', filters);

const getActivity = (filters: DashboardFilters) =>
  fetchDashboard<DashboardActivity>('activity', filters);

export const dashboardApi = {
  getOverview,
  getGlobal,
  getSales,
  getPurchases,
  getPayments,
  getTreasury,
  getWithholding,
  getReferentials,
  getActivity
};
