import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { cn } from '@/lib/utils';
import { CreateArticleDto } from '@/types';
import { getErrorMessage } from '@/utils/errors';
import { ArticleEditorContent } from './form/ArticleEditorContent';
import { useArticleManager } from './hooks/useArticleManager';

interface ArticleCreateFormProps {
  className?: string;
}

export const ArticleCreateForm = ({ className }: ArticleCreateFormProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t: tCommon } = useTranslation('common');
  const { t: tArticles } = useTranslation('articles');
  const { setRoutes } = useBreadcrumb();
  const articleManager = useArticleManager();

  React.useEffect(() => {
    setRoutes?.([
      { title: tCommon('menu.articles'), href: '/articles' },
      { title: tArticles('pages.create_title') }
    ]);
  }, [router.locale]);

  React.useEffect(() => {
    articleManager.reset();
  }, []);

  const { taxes, isFetchTaxesPending } = useTax();

  const { mutate: createArticle, isPending: isCreatePending } = useMutation({
    mutationFn: (data: CreateArticleDto) => api.article.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['articles'] });
      articleManager.reset();
      toast.success(tArticles('messages.create_success'));
      router.push('/articles');
    },
    onError: (error) => {
      toast.error(getErrorMessage('articles', error, tArticles('messages.create_error')));
    }
  });

  const loading = isFetchTaxesPending;

  const handleSubmit = () => {
    const data = articleManager.getArticle() as CreateArticleDto;
    const validation = api.article.validate(data);
    if (validation.message) {
      toast.error(tArticles(validation.message));
      return;
    }

    createArticle(data);
  };

  if (loading) {
    return <Spinner className="h-screen" show />;
  }

  return (
    <div className={cn('flex-1 overflow-auto py-6', className)}>
      <div className={cn('flex flex-col gap-6 pb-8', isCreatePending ? 'pointer-events-none' : '')}>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {tArticles('pages.create_title')}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" className="h-11 rounded-md px-5" onClick={() => router.push('/articles')}>
                <ArrowLeft className="h-4 w-4" />
                {tCommon('commands.back')}
              </Button>
              <Button className="h-11 rounded-md px-5" onClick={handleSubmit}>
                {tCommon('commands.create')}
                <Spinner className="ml-2" size="small" show={isCreatePending} />
              </Button>
            </div>
          </div>
        </div>

        <Card className="rounded-lg border-zinc-200 shadow-sm dark:border-zinc-800">
          <CardContent className="space-y-8 p-6">
            <ArticleEditorContent
              loading={loading || isCreatePending}
              taxes={taxes}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
