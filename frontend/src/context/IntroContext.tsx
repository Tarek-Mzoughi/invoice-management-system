import React from 'react';

interface IntroContextProps {
  title: string;
  description: string;
  floating: React.ReactNode;
  setIntro: (title: string, description: string) => void;
  setFloating: (node: React.ReactNode) => void;
  clearIntro: () => void;
  clearFloating: () => void;
}

export const IntroContext = React.createContext<Partial<IntroContextProps>>({});

export const useIntro = () => React.useContext(IntroContext);
