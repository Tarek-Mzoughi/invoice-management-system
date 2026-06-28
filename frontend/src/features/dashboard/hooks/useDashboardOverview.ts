import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { shouldRetryQuery } from '@/utils/queryErrors';
import { dashboardApi } from '../api/dashboard.api';
import { DashboardFilters, DashboardTab } from '../types/dashboard.types';

export const DASHBOARD_OVERVIEW_QUERY_KEY = 'dashboard-overview';
export const DASHBOARD_GLOBAL_QUERY_KEY = 'dashboard-global';
export const DASHBOARD_SALES_QUERY_KEY = 'dashboard-sales';
export const DASHBOARD_PURCHASES_QUERY_KEY = 'dashboard-purchases';
export const DASHBOARD_PAYMENTS_QUERY_KEY = 'dashboard-payments';
export const DASHBOARD_TREASURY_QUERY_KEY = 'dashboard-treasury';
export const DASHBOARD_WITHHOLDING_QUERY_KEY = 'dashboard-withholding';
export const DASHBOARD_REFERENTIALS_QUERY_KEY = 'dashboard-referentials';
export const DASHBOARD_ACTIVITY_QUERY_KEY = 'dashboard-activity';

const QUERY_OPTIONS = {
  staleTime: 30_000,
  refetchInterval: 60_000,
  placeholderData: keepPreviousData,
  retry: shouldRetryQuery
} as const;

/** Legacy — kept for backward compatibility */
export const useDashboardOverview = (filters: DashboardFilters) =>
  useQuery({
    queryKey: [DASHBOARD_OVERVIEW_QUERY_KEY, filters],
    queryFn: () => dashboardApi.getOverview(filters),
    ...QUERY_OPTIONS
  });

export const useDashboardGlobal = (filters: DashboardFilters, enabled = true) =>
  useQuery({
    queryKey: [DASHBOARD_GLOBAL_QUERY_KEY, filters],
    queryFn: () => dashboardApi.getGlobal(filters),
    enabled,
    ...QUERY_OPTIONS
  });

export const useDashboardSales = (filters: DashboardFilters, enabled = true) =>
  useQuery({
    queryKey: [DASHBOARD_SALES_QUERY_KEY, filters],
    queryFn: () => dashboardApi.getSales(filters),
    enabled,
    ...QUERY_OPTIONS
  });

export const useDashboardPurchases = (filters: DashboardFilters, enabled = true) =>
  useQuery({
    queryKey: [DASHBOARD_PURCHASES_QUERY_KEY, filters],
    queryFn: () => dashboardApi.getPurchases(filters),
    enabled,
    ...QUERY_OPTIONS
  });

export const useDashboardPayments = (filters: DashboardFilters, enabled = true) =>
  useQuery({
    queryKey: [DASHBOARD_PAYMENTS_QUERY_KEY, filters],
    queryFn: () => dashboardApi.getPayments(filters),
    enabled,
    ...QUERY_OPTIONS
  });

export const useDashboardTreasury = (filters: DashboardFilters, enabled = true) =>
  useQuery({
    queryKey: [DASHBOARD_TREASURY_QUERY_KEY, filters],
    queryFn: () => dashboardApi.getTreasury(filters),
    enabled,
    ...QUERY_OPTIONS
  });

export const useDashboardWithholding = (filters: DashboardFilters, enabled = true) =>
  useQuery({
    queryKey: [DASHBOARD_WITHHOLDING_QUERY_KEY, filters],
    queryFn: () => dashboardApi.getWithholding(filters),
    enabled,
    ...QUERY_OPTIONS
  });

export const useDashboardReferentials = (filters: DashboardFilters, enabled = true) =>
  useQuery({
    queryKey: [DASHBOARD_REFERENTIALS_QUERY_KEY, filters],
    queryFn: () => dashboardApi.getReferentials(filters),
    enabled,
    ...QUERY_OPTIONS
  });

export const useDashboardActivity = (filters: DashboardFilters, enabled = true) =>
  useQuery({
    queryKey: [DASHBOARD_ACTIVITY_QUERY_KEY, filters],
    queryFn: () => dashboardApi.getActivity(filters),
    enabled,
    ...QUERY_OPTIONS
  });
