import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { HookQueryOptions, normalizeHookQueryOptions } from './queryOptions';
import { ACTIVITY_TYPE } from '@/types/enums/activity-type';

interface UseArticleChoicesOptions extends HookQueryOptions {
  context?: 'document';
  activityType?: ACTIVITY_TYPE | 'selling' | 'buying';
}

const normalizeActivityType = (
  activityType?: ACTIVITY_TYPE | 'selling' | 'buying'
): 'selling' | 'buying' => {
  return String(activityType || '') === ACTIVITY_TYPE.BUYING ? 'buying' : 'selling';
};

const useArticleChoices = (options?: boolean | UseArticleChoicesOptions) => {
  const { enabled, silentForbiddenToast } = normalizeHookQueryOptions(options);
  const context = typeof options === 'object' ? options.context : undefined;
  const activityType =
    typeof options === 'object' ? normalizeActivityType(options.activityType) : 'selling';

  const { isFetching: isFetchArticlesPending, data: articlesResp } = useQuery({
    queryKey: ['article-choices', context, activityType],
    queryFn: () =>
      context === 'document'
        ? api.article.findDocumentChoices(activityType, { silentForbiddenToast })
        : api.article.findAll({ silentForbiddenToast }),
    enabled
  });

  const articles = React.useMemo(() => {
    if (!enabled) return [];
    if (!articlesResp) return [];
    return articlesResp;
  }, [articlesResp, enabled]);

  return {
    articles,
    isFetchArticlesPending: enabled ? isFetchArticlesPending : false
  };
};

export default useArticleChoices;
