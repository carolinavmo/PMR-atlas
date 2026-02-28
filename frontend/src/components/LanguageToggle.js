import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Globe } from 'lucide-react';

export const LanguageToggle = () => {
  const { toggleLanguage, getCurrentLanguageInfo } = useLanguage();
  const langInfo = getCurrentLanguageInfo();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
      title={`Current: ${langInfo.name}. Click to switch language.`}
      data-testid="language-toggle"
    >
      <Globe className="w-4 h-4" />
      <span className="text-lg">{langInfo.flag}</span>
      <span className="hidden sm:inline text-sm font-medium">{langInfo.code.toUpperCase()}</span>
    </Button>
  );
};
