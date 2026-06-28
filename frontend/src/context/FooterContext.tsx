import React from 'react';

interface FooterContextProps {
  content: React.ReactNode;
  setContent: (routes: React.ReactNode) => void;
  clearContent: () => void;
}

export const FooterContext = React.createContext<Partial<FooterContextProps>>({});

export const useFooter = () => React.useContext(FooterContext);
