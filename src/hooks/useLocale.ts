import { useLocaleContext } from '../contexts/LocaleContext';

export const useLocale = () => {
  const { t, locale, setLocale } = useLocaleContext();
  return { t, locale, setLocale };
};
