import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { ACTIVITY_TYPE, QUOTATION_STATUS } from '@/types';

const useQuotationChoices = (
  status: QUOTATION_STATUS,
  enabled: boolean = true,
  activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING
) => {
  const { isPending: isFetchQuotationPending, data: quotationsResp } = useQuery({
    queryKey: ['quotation-choices', status, activityType],
    queryFn: () => api.quotation.findChoices(status, activityType),
    enabled: enabled
  });

  const quotations = React.useMemo(() => {
    if (!quotationsResp) return [];
    return quotationsResp;
  }, [quotationsResp]);

  return {
    quotations,
    isFetchQuotationPending
  };
};

export default useQuotationChoices;
