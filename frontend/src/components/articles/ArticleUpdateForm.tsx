import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '@/api';
import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import useTax from '@/hooks/content/useTax';
import useInitializedState from '@/hooks/use-initialized-state';
import { cn } from '@/lib/utils';
import { UpdateArticleDto } from '@/types';
import { getErrorMessage } from '@/utils/errors';
import { ArticleEditorContent } from './form/ArticleEditorContent';
import { useArticleManager } from './hooks/useArticleManager';

interface ArticleUpdateFormProps {
  articleId?: number;
  className?: string;
}

export const ArticleUpdateForm = ({ articleId, className }: ArticleUpdateFormProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t: tCommon } = useTranslation('common');
  const { t: tArticles } = useTranslation('articles');
  const { setRoutes } = useBreadcrumb();
  const articleManager = useArticleManager();

  const { data: article, isPending: isFetchArticlePending, error } = useQuery({
    queryKey: ['article', articleId],
    queryFn: () => api.article.findOne(articleId),
    enabled: !!articleId
  });

  React.useEffect(() => {
    if (!articleId) return;

    setRoutes?.([
      { title: tCommon('menu.articles'), href: '/articles' },
      { title: article?.title || `${tArticles('singular')} #${articleId}`, href: `/articles/${articleId}` },
      { title: tCommon('commands.edit') }
    ]);
  }, [router.locale, articleId, article?.title]);

  React.useEffect(() => {
    if (!article) return;
    articleManager.reset();
    articleManager.setArticle(article);
  }, [article]);

  const { taxes, isFetchTaxesPending } = useTax();

  const { mutate: updateArticle, isPending: isUpdatePending } = useMutation({
    mutationFn: (data: UpdateArticleDto) => api.article.update(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['articles'] });
      await queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      toast.success(tArticles('messages.update_success'));
      router.push('/articles');
    },
    onError: (mutationError) => {
      toast.error(getErrorMessage('articles', mutationError, tArticles('messages.update_error')));
    }
  });

  const loading = isFetchArticlePending || isFetchTaxesPending;

  const { isDisabled } = useInitializedState({
    data: article || {},
    getCurrentData: () => articleManager.getArticle(),
    setFormData: (data) => articleManager.setArticle(data),
    resetData: () => articleManager.reset(),
    loading
  });

  const handleSubmit = () => {
    const data = articleManager.getArticle() as UpdateArticleDto;
    const validation = api.article.validate(data);
    if (validation.message) {
      toast.error(tArticles(validation.message));
      return;
    }

    updateArticle({ ...data, id: articleId });
  };

  if (error) {
    return tArticles('messages.load_error');
  }

  if (loading) {
    return <Spinner className="h-screen" show />;
  }

  return (
    <div className={cn('flex-1 overflow-auto py-6', className)}>
      <div className={cn('flex flex-col gap-6 pb-8', isUpdatePending ? 'pointer-events-none' : '')}>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {tArticles('pages.update_title')}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" className="h-11 rounded-md px-5" onClick={() => router.push('/articles')}>
                <ArrowLeft className="h-4 w-4" />
                {tCommon('commands.back')}
              </Button>
              <Button className="h-11 rounded-md px-5" disabled={isDisabled || loading} onClick={handleSubmit}>
                {tCommon('commands.save')}
                <Spinner className="ml-2" size="small" show={isUpdatePending} />
              </Button>
            </div>
          </div>
        </div>

        <Card className="rounded-lg border-zinc-200 shadow-sm dark:border-zinc-800">
          <CardContent className="space-y-8 p-6">
            <ArticleEditorContent
              loading={loading || isUpdatePending}
              taxes={taxes}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
