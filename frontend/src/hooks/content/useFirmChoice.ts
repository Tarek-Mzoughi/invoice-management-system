import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { Firm, FirmEntityType } from '@/types';
import { HookQueryOptions, normalizeHookQueryOptions } from './queryOptions';
import { ACTIVITY_TYPE } from '@/types/enums/activity-type';

interface UseFirmChoicesOptions extends HookQueryOptions {
  params?: string[];
  entityType?: FirmEntityType;
  context?: 'document';
  activityType?: ACTIVITY_TYPE | 'selling' | 'buying';
}

function useFirmChoices(options?: UseFirmChoicesOptions): {
  firms: Partial<Firm>[];
  isFetchFirmsPending: boolean;
};
function useFirmChoices(
  params: string[],
  enabled?: boolean | HookQueryOptions,
  entityType?: FirmEntityType
): {
  firms: Partial<Firm>[];
  isFetchFirmsPending: boolean;
};
function useFirmChoices(
  paramsOrOptions: string[] | UseFirmChoicesOptions = [],
  enabledOrOptions: boolean | HookQueryOptions = true,
  legacyEntityType?: FirmEntityType
) {
  const isLegacySignature = Array.isArray(paramsOrOptions);
  const queryOptions = normalizeHookQueryOptions(
    isLegacySignature ? enabledOrOptions : paramsOrOptions
  );
  const params = isLegacySignature ? paramsOrOptions : paramsOrOptions.params || [];
  const entityType = isLegacySignature ? legacyEntityType : paramsOrOptions.entityType;
  const context = isLegacySignature ? undefined : paramsOrOptions.context;
  const activityType = isLegacySignature ? undefined : paramsOrOptions.activityType;
  const { enabled, silentForbiddenToast } = queryOptions;

  const { isPending: isFetchFirmsPending, data: firmsResp } = useQuery({
    queryKey: ['firm-choices', params, entityType, context, activityType],
    queryFn: () =>
      context === 'document' && entityType
        ? api.firm.findDocumentChoices(entityType, { silentForbiddenToast })
        : api.firm.findChoices(params, entityType, { silentForbiddenToast }),
    enabled
  });

  const firms = React.useMemo(() => {
    if (!enabled) return [];
    if (!firmsResp) return [];
    return firmsResp;
  }, [enabled, firmsResp]);

  return {
    firms,
    isFetchFirmsPending: enabled ? isFetchFirmsPending : false
  };
}

export default useFirmChoices;
