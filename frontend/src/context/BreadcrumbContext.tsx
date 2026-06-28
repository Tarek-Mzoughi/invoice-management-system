import React from 'react';

export type BreadcrumbRoute = { title: string; href?: string };

interface BreadcrumbContextProps {
  routes: BreadcrumbRoute[];
  setRoutes: (routes: BreadcrumbRoute[]) => void;
  clearRoutes: () => void;
}

export const BreadcrumbContext = React.createContext<Partial<BreadcrumbContextProps>>({});

export const useBreadcrumb = () => React.useContext(BreadcrumbContext);
