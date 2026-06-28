import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import type { HookQueryOptions } from './queryOptions';

interface UseSequenceProps extends HookQueryOptions {
  label: string;
}

export const useSequence = ({
  label,
  enabled = true,
  silentForbiddenToast
}: UseSequenceProps) => {
  const queryEnabled = enabled && !!label;
  const {
    data: sequence,
    isPending: isSequencePending,
    refetch: refetchSequence
  } = useQuery({
    queryKey: ['sequence', label],
    queryFn: async () => api.sequence.findByLabel(label, { silentForbiddenToast }),
    enabled: queryEnabled
  });

  return {
    sequence: queryEnabled ? sequence : undefined,
    isSequencePending: queryEnabled ? isSequencePending : false,
    refetchSequence
  };
};
