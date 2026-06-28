import React from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { api } from '@/api';
import { Spinner } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ACTIVITY_TYPE } from '@/types';
import { PaymentWorkflowForm } from './PaymentWorkflowForm';

type UnifiedPaymentWorkflowMode = 'create' | 'update';
type PaymentRouteType = 'selling' | 'buying';

interface UnifiedPaymentWorkflowPageProps {
  className?: string;
  firmId?: string;
  listPath?: string;
  mode: UnifiedPaymentWorkflowMode;
  paymentId?: string;
}

const EMPTY_PAYMENT_TYPE_VALUE = '__payment_type_empty__';

const routeTypeToActivityType: Record<PaymentRouteType, ACTIVITY_TYPE> = {
  buying: ACTIVITY_TYPE.BUYING,
  selling: ACTIVITY_TYPE.SELLING
};

const activityTypeToRouteType = (activityType?: ACTIVITY_TYPE): PaymentRouteType | undefined => {
  if (activityType === ACTIVITY_TYPE.BUYING) return 'buying';
  if (activityType === ACTIVITY_TYPE.SELLING) return 'selling';
  return undefined;
};

const getQueryString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const parseRouteType = (value: string | string[] | undefined): PaymentRouteType | undefined => {
  const type = getQueryString(value);
  return type === 'buying' || type === 'selling' ? type : undefined;
};

const getActivityDirectionClassName = (activityType?: ACTIVITY_TYPE) => {
  if (!activityType) {
    return 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300';
  }

  return activityType === ACTIVITY_TYPE.BUYING
    ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300';
};

const getActivityLabelKey = (activityType?: ACTIVITY_TYPE) =>
  activityType === ACTIVITY_TYPE.BUYING
    ? 'payment.type_selector.buying'
    : 'payment.type_selector.selling';

const getActivityHelperKey = (activityType?: ACTIVITY_TYPE) =>
  activityType === ACTIVITY_TYPE.BUYING
    ? 'payment.type_selector.buying_helper'
    : 'payment.type_selector.selling_helper';

interface PaymentTypeSelectProps {
  disabled?: boolean;
  label: string;
  onChange: (activityType: ACTIVITY_TYPE) => void;
  placeholder: string;
  value?: ACTIVITY_TYPE;
}

const PaymentTypeSelect = ({
  disabled,
  label,
  onChange,
  placeholder,
  value
}: PaymentTypeSelectProps) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const routeTypeValue = activityTypeToRouteType(value) || EMPTY_PAYMENT_TYPE_VALUE;

  return (
    <Select
      disabled={disabled}
      value={routeTypeValue}
      onValueChange={(nextValue) => {
        if (nextValue !== 'buying' && nextValue !== 'selling') return;
        onChange(routeTypeToActivityType[nextValue]);
      }}
    >
      <SelectTrigger aria-label={label}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={EMPTY_PAYMENT_TYPE_VALUE} disabled>
          {placeholder}
        </SelectItem>
        <SelectItem value="selling">{tInvoicing('payment.type_selector.selling')}</SelectItem>
        <SelectItem value="buying">{tInvoicing('payment.type_selector.buying')}</SelectItem>
      </SelectContent>
    </Select>
  );
};

export const UnifiedPaymentWorkflowPage = ({
  className,
  firmId,
  listPath = '/payments',
  mode,
  paymentId
}: UnifiedPaymentWorkflowPageProps) => {
  const router = useRouter();
  const { t: tInvoicing } = useTranslation('invoicing');
  const queryPaymentId = paymentId || getQueryString(router.query.id);
  const queryFirmId = firmId || getQueryString(router.query.firmId);
  const routeType = parseRouteType(router.query.type);
  const selectedCreateActivityType = routeType ? routeTypeToActivityType[routeType] : undefined;

  const {
    data: payment,
    error: paymentError,
    isPending: isPaymentPending
  } = useQuery({
    queryKey: ['payment', queryPaymentId, 'workflow-activity'],
    queryFn: () => api.payment.findOne(Number(queryPaymentId), ['firm', 'currency']),
    enabled: mode === 'update' && !!queryPaymentId
  });

  const resolvedActivityType =
    mode === 'update'
      ? payment?.activityType === ACTIVITY_TYPE.BUYING
        ? ACTIVITY_TYPE.BUYING
        : payment?.activityType === ACTIVITY_TYPE.SELLING
          ? ACTIVITY_TYPE.SELLING
          : undefined
      : selectedCreateActivityType;

  const handlePaymentTypeChange = React.useCallback(
    (activityType: ACTIVITY_TYPE) => {
      const nextType = activityTypeToRouteType(activityType);
      if (!nextType || mode !== 'create') return;

      void router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            type: nextType
          }
        },
        undefined,
        { shallow: true }
      );
    },
    [mode, router]
  );

  if (mode === 'update' && (isPaymentPending || !router.isReady)) {
    return <Spinner className="h-screen" show />;
  }

  const activeActivityType =
    mode === 'update' && (paymentError || !queryPaymentId) ? undefined : resolvedActivityType;
  const helperText = activeActivityType
    ? tInvoicing(getActivityHelperKey(activeActivityType))
    : tInvoicing('payment.type_selector.empty_description', {
        defaultValue:
          'Le formulaire chargera automatiquement les clients, fournisseurs et documents selon le type choisi.'
      });

  return (
    <PaymentWorkflowForm
      key={`${mode}-${activeActivityType || 'unset'}-${queryPaymentId || 'new'}`}
      activityType={activeActivityType}
      className={className}
      firmId={queryFirmId}
      listPath={listPath}
      mode={mode}
      paymentId={queryPaymentId}
      paymentTypeControl={
        <div className="flex flex-col gap-2">
          <PaymentTypeSelect
            disabled={mode === 'update'}
            label={tInvoicing('payment.type_selector.label', {
              defaultValue: 'Type de paiement'
            })}
            onChange={handlePaymentTypeChange}
            placeholder={tInvoicing('payment.type_selector.placeholder', {
              defaultValue: 'Choisissez un type de paiement'
            })}
            value={activeActivityType}
          />
          <Badge
            variant="outline"
            className={cn('w-fit', getActivityDirectionClassName(activeActivityType))}
          >
            {activeActivityType
              ? tInvoicing(getActivityLabelKey(activeActivityType))
              : tInvoicing('payment.new')}
          </Badge>
        </div>
      }
      paymentTypeHelperText={
        mode === 'update'
          ? tInvoicing('payment.type_selector.locked_helper', {
              defaultValue: 'Le type de paiement est verrouillé pour un paiement existant.'
            })
          : helperText
      }
    />
  );
};
