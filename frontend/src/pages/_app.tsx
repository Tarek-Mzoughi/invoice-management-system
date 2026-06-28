import React from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Application from '@/components/Application';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { appWithTranslation } from 'next-i18next';
import nextI18nextConfig from '../../next-i18next.config';
import { ThemeProvider } from '@/context/ThemeContext';
import '@/styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { AuthTokenSync } from '@/components/auth/AuthTokenSync';
import { shouldRetryQuery } from '@/utils/queryErrors';

const inter = { className: 'font-inter' };
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery
    }
  }
});
const errorRoutes = new Set(['/404', '/500', '/_error']);

const App = ({ Component, router, pageProps: { session, ...pageProps } }: AppProps) => {
  const isErrorRoute = errorRoutes.has(router.pathname);

  return (
    <React.Fragment>
      <Head>
        <title>Invoicing System</title>
        <meta
          name="description"
          content="Professional invoicing, sales, purchases, payments, and business management platform by Tarek Mzoughi"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      {isErrorRoute ? (
        <main className={inter.className}>
          <Component {...pageProps} />
        </main>
      ) : (
        <SessionProvider session={session}>
          <AuthTokenSync />
          <QueryClientProvider client={queryClient}>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange>
              <Application
                Component={Component}
                pageProps={pageProps}
                className={inter.className}
              />
            </ThemeProvider>
          </QueryClientProvider>
        </SessionProvider>
      )}
    </React.Fragment>
  );
};

export default appWithTranslation(App, nextI18nextConfig);
