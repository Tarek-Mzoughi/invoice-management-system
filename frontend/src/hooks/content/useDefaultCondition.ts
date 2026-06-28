import { api } from '@/api';
import { ACTIVITY_TYPE } from '@/types/enums/activity-type';
import { DOCUMENT_TYPE } from '@/types/enums/document-type';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { HookQueryOptions, normalizeHookQueryOptions } from './queryOptions';

const useDefaultCondition = (
  activity_type: ACTIVITY_TYPE,
  document_type: DOCUMENT_TYPE,
  options?: boolean | HookQueryOptions
) => {
  const { enabled, silentForbiddenToast } = normalizeHookQueryOptions(options);

  const { isPending: isFetchDefaultConditionPending, data: defaultConditionResp } = useQuery({
    queryKey: ['default-conditions', activity_type, document_type],
    queryFn: () =>
      api.defaultCondition.find(activity_type, document_type, { silentForbiddenToast }),
    enabled
  });

  const defaultCondition = React.useMemo(() => {
    if (!enabled) return '';
    if (defaultConditionResp && defaultConditionResp.length > 0) {
      return defaultConditionResp[0]?.value;
    } else return '';
  }, [defaultConditionResp, enabled]);

  return {
    defaultCondition,
    isFetchDefaultConditionPending: enabled ? isFetchDefaultConditionPending : false
  };
};

export default useDefaultCondition;
