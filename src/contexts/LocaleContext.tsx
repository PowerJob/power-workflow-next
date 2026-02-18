import React, { createContext, useContext, useState } from 'react';
import { zhCN, type LocaleKey } from '../locales/zh-CN';
import { enUS } from '../locales/en-US';

export type LocaleType = 'zh-CN' | 'en-US';

interface LocaleContextType {
  locale: LocaleType;
  setLocale: (locale: LocaleType) => void;
  t: (key: LocaleKey | string) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

interface LocaleProviderProps {
  children: React.ReactNode;
  defaultLocale?: LocaleType;
}

export const LocaleProvider: React.FC<LocaleProviderProps> = ({ 
  children, 
  defaultLocale = 'zh-CN' 
}) => {
  const [locale, setLocale] = useState<LocaleType>(defaultLocale);

  const t = (key: LocaleKey | string): string => {
    const messages = locale === 'zh-CN' ? zhCN : enUS;
    return (messages as Record<string, string>)[key] || key;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocaleContext = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocaleContext must be used within a LocaleProvider');
  }
  return context;
};
