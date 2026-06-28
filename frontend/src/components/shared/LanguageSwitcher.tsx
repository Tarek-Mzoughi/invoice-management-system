import React from 'react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  className?: string;
}
export const LanguageSwitcher = ({ className }: LanguageSwitcherProps) => {
  const router = useRouter();
  const { i18n, t } = useTranslation();

  const [currentLanguage, setCurrentLanguage] = React.useState<string>(i18n.language);

  React.useEffect(() => {
    const storedLocale = localStorage.getItem('locale');

    const languageToUse = storedLocale || i18n.language;

    if (languageToUse !== i18n.language) {
      i18n.changeLanguage(languageToUse).then(() => {
        setCurrentLanguage(languageToUse);
      });
    } else {
      setCurrentLanguage(languageToUse);
    }
  }, [i18n.language]);

  const onToggleLanguageClick = (newLocale: string) => {
    const { pathname, asPath, query } = router;

    router.push({ pathname, query }, asPath, { locale: newLocale }).then(() => {
      localStorage.setItem('locale', newLocale);
      i18n.changeLanguage(newLocale);
      setCurrentLanguage(newLocale);
    });
  };

  return (
    <div className={cn(className)}>
      <Select
        value={currentLanguage} // only set when defined
        onValueChange={onToggleLanguageClick}>
        <SelectTrigger>
          <SelectValue placeholder={t('selectLanguage')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fr">{t('languages.fr')}</SelectItem>
          <SelectItem value="en">{t('languages.en')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
