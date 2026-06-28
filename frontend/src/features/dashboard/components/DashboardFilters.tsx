import React from 'react';
import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import useFirmChoices from '@/hooks/content/useFirmChoice';
import useCurrency from '@/hooks/content/useCurrency';
import {
  DashboardDocumentType,
  DashboardFilters as DashboardFiltersValue,
  DashboardPeriod
} from '../types/dashboard.types';

interface DashboardFiltersProps {
  canReadBuyingDocuments: boolean;
  canReadClients: boolean;
  canReadPayments: boolean;
  canReadSellingDocuments: boolean;
  canReadSuppliers: boolean;
  filters: DashboardFiltersValue;
  onChange: (filters: DashboardFiltersValue) => void;
}

interface SelectableFirm {
  id: number;
  name?: string;
}

const hasNumericId = (firm: { id?: number }): firm is SelectableFirm => typeof firm.id === 'number';

const toDateInputValue = (date: Date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

const getDefaultCustomRange = () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    startDate: toDateInputValue(startDate),
    endDate: toDateInputValue(now)
  };
};

const periods: DashboardPeriod[] = [
  'today',
  'last7Days',
  'last30Days',
  'currentMonth',
  'currentYear',
  'custom'
];

const documentTypes: DashboardDocumentType[] = [
  'all',
  'invoice',
  'quotation',
  'payment',
  'customerOrder',
  'purchase'
];

const getDocumentTypePermission = (
  documentType: DashboardDocumentType,
  permissions: Pick<
    DashboardFiltersProps,
    'canReadBuyingDocuments' | 'canReadPayments' | 'canReadSellingDocuments'
  >
) => {
  if (documentType === 'all') return true;
  if (documentType === 'payment') return permissions.canReadPayments;
  if (documentType === 'purchase') return permissions.canReadBuyingDocuments;
  return permissions.canReadSellingDocuments;
};

export const DashboardFilters = ({
  canReadBuyingDocuments,
  canReadClients,
  canReadPayments,
  canReadSellingDocuments,
  canReadSuppliers,
  filters,
  onChange
}: DashboardFiltersProps) => {
  const { t } = useTranslation('dashboard');
  const { currencies } = useCurrency();
  const { firms: clients } = useFirmChoices({
    params: [],
    entityType: 'clients',
    enabled: canReadClients
  });
  const { firms: suppliers } = useFirmChoices({
    params: [],
    entityType: 'suppliers',
    enabled: canReadSuppliers
  });

  const update = (patch: Partial<DashboardFiltersValue>) => onChange({ ...filters, ...patch });
  const availableDocumentTypes = documentTypes.filter((documentType) =>
    getDocumentTypePermission(documentType, {
      canReadBuyingDocuments,
      canReadPayments,
      canReadSellingDocuments
    })
  );
  const selectableClients = clients.filter(hasNumericId);
  const selectableSuppliers = suppliers.filter(hasNumericId);

  React.useEffect(() => {
    const patch: Partial<DashboardFiltersValue> = {};

    if (!canReadClients && filters.clientId) {
      patch.clientId = undefined;
    }

    if (!canReadSuppliers && filters.supplierId) {
      patch.supplierId = undefined;
    }

    if (
      filters.documentType !== 'all' &&
      !getDocumentTypePermission(filters.documentType, {
        canReadBuyingDocuments,
        canReadPayments,
        canReadSellingDocuments
      })
    ) {
      patch.documentType = 'all';
    }

    if (Object.keys(patch).length > 0) {
      onChange({ ...filters, ...patch });
    }
  }, [
    canReadBuyingDocuments,
    canReadClients,
    canReadPayments,
    canReadSellingDocuments,
    canReadSuppliers,
    filters,
    onChange
  ]);

  const handlePeriodChange = (period: DashboardPeriod) => {
    if (period === 'custom') {
      const defaultRange = getDefaultCustomRange();
      update({
        period,
        startDate: filters.startDate || defaultRange.startDate,
        endDate: filters.endDate || defaultRange.endDate
      });
      return;
    }

    update({ period, startDate: undefined, endDate: undefined });
  };
  const reset = () =>
    onChange({
      period: 'currentYear',
      documentType: 'all',
      topLimit: 5
    });

  return (
    <div className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:grid-cols-2 xl:grid-cols-7">
      <div className="space-y-1.5">
        <Label className="text-xs">{t('filters.period')}</Label>
        <Select
          value={filters.period}
          onValueChange={(value) => handlePeriodChange(value as DashboardPeriod)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periods.map((period) => (
              <SelectItem key={period} value={period}>
                {t(`filters.periods.${period}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filters.period === 'custom' ? (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('filters.startDate')}</Label>
            <Input
              type="date"
              value={filters.startDate || ''}
              onChange={(event) => update({ startDate: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('filters.endDate')}</Label>
            <Input
              type="date"
              value={filters.endDate || ''}
              onChange={(event) => update({ endDate: event.target.value })}
            />
          </div>
        </>
      ) : null}

      <div className="space-y-1.5">
        <Label className="text-xs">{t('filters.documentType')}</Label>
        <Select
          value={filters.documentType}
          onValueChange={(value) => update({ documentType: value as DashboardDocumentType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableDocumentTypes.map((documentType) => (
              <SelectItem key={documentType} value={documentType}>
                {t(`filters.documentTypes.${documentType}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {canReadClients ? (
        <div className="space-y-1.5">
          <Label className="text-xs">{t('filters.client')}</Label>
          <Select
            value={filters.clientId ? String(filters.clientId) : 'all'}
            onValueChange={(value) =>
              update({ clientId: value === 'all' ? undefined : Number(value) })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allClients')}</SelectItem>
              {selectableClients.map((client) => (
                <SelectItem key={client.id} value={String(client.id)}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {canReadSuppliers ? (
        <div className="space-y-1.5">
          <Label className="text-xs">{t('filters.supplier')}</Label>
          <Select
            value={filters.supplierId ? String(filters.supplierId) : 'all'}
            onValueChange={(value) =>
              update({ supplierId: value === 'all' ? undefined : Number(value) })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allSuppliers')}</SelectItem>
              {selectableSuppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={String(supplier.id)}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label className="text-xs">{t('filters.currency')}</Label>
        <Select
          value={filters.currencyId ? String(filters.currencyId) : 'cabinet'}
          onValueChange={(value) =>
            update({ currencyId: value === 'cabinet' ? undefined : Number(value) })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cabinet">{t('filters.cabinetCurrency')}</SelectItem>
            {currencies.map((currency) => (
              <SelectItem key={currency.id} value={String(currency.id)}>
                {currency.code || currency.label} {currency.symbol ? `(${currency.symbol})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end">
        <Button variant="outline" className="w-full" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
          {t('filters.reset')}
        </Button>
      </div>
    </div>
  );
};
