import React from 'react';
import { cn } from '@/lib/utils';
import { Header } from './Header';
import { BreadcrumbContext, BreadcrumbRoute } from '../../context/BreadcrumbContext';
import { SidebarInset, SidebarProvider } from '../ui/sidebar';
import { AppSidebar } from './sidebar/AppSidebar';
import { AppVersion } from './AppVersion';
import { IntroContext } from '@/context/IntroContext';
import { FooterContext } from '@/context/FooterContext';
import { PageHeader } from './PageHeader';
import { useMediaQuery } from '@/hooks/other/useMediaQuery';
import { Footer } from './Footer';
import { AiChatbot } from '../ai/AiChatbot';
import { useModuleSettingsStore } from '@/hooks/stores/useModuleSettingsStore';

interface LayoutProps {
  className?: string;
  children: React.ReactNode;
}

export const Layout = ({ children, className }: LayoutProps) => {
  const [routes, setRoutes] = React.useState<BreadcrumbRoute[]>([]);
  const clearRoutes = React.useCallback(() => {
    setRoutes([]);
  }, []);
  const breadcrumbContext = React.useMemo(
    () => ({
      routes,
      setRoutes,
      clearRoutes
    }),
    [clearRoutes, routes]
  );

  const [content, setContent] = React.useState<React.ReactNode>(null);
  const clearContent = React.useCallback(() => {
    setContent(null);
  }, []);
  const footerContext = React.useMemo(
    () => ({
      content,
      setContent,
      clearContent
    }),
    [clearContent, content]
  );

  const [title, setTitle] = React.useState<string>('');
  const [description, setDescription] = React.useState<string>('');
  const [floating, setFloating] = React.useState<React.ReactNode>(null);
  const setIntro = React.useCallback((title: string, description?: string) => {
    setTitle(title);
    setDescription(description || '');
  }, []);
  const clearIntro = React.useCallback(() => {
    setTitle('');
    setDescription('');
  }, []);
  const clearFloating = React.useCallback(() => {
    setFloating(null);
  }, []);
  const introContext = React.useMemo(
    () => ({
      title,
      description,
      floating,
      setIntro,
      setFloating,
      clearIntro,
      clearFloating
    }),
    [clearFloating, clearIntro, description, floating, setIntro, title]
  );

  const isMobile = useMediaQuery('(max-width: 425px)');
  const showFloatingAi = useModuleSettingsStore((state) => state.modules.ai_floating_button);

  return (
    <div
      className={cn(
        'flex md:flex-cols-[220px_1fr] lg:flex-cols-[280px_1fr] overflow-hidden fullscreen',
        className
      )}>
      <SidebarProvider className="flex flex-row flex-1 overflow-hidden min-w-screen max-w-screen">
        <BreadcrumbContext.Provider value={breadcrumbContext}>
          <IntroContext.Provider value={introContext}>
            <FooterContext.Provider value={footerContext}>
              <div className="flex flex-row flex-1 overflow-hidden">
                {/* Sidebar */}
                <AppSidebar />
                {/* Header , Main & Footer */}
                <div className="flex flex-col flex-1 overflow-hidden bg-background">
                  <Header />
                  {(title || description) && (
                    <PageHeader className={cn('py-5', isMobile ? 'px-4' : 'px-10')} />
                  )}
                  <main
                    className={cn(
                      'flex flex-col flex-1 overflow-hidden',
                      isMobile ? 'px-4' : 'px-10',
                      className
                    )}>
                    {children}
                  </main>
                  {content && <Footer />}
                </div>
              </div>
              {showFloatingAi && <AiChatbot />}
            </FooterContext.Provider>
          </IntroContext.Provider>
        </BreadcrumbContext.Provider>
      </SidebarProvider>
    </div>
  );
};
