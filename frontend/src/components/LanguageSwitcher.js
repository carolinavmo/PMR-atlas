import { useState } from 'react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Globe, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

export const LanguageSwitcher = ({ 
  currentLanguage = 'en', 
  onLanguageChange, 
  diseaseId,
  getAuthHeaders,
  onTranslationComplete 
}) => {
  const [translating, setTranslating] = useState(false);

  const handleLanguageChange = async (langCode) => {
    if (langCode === currentLanguage) return;
    
    // If we have a disease ID, trigger translation
    if (diseaseId && langCode !== 'en') {
      setTranslating(true);
      try {
        const headers = getAuthHeaders();
        await axios.post(
          `${API_URL}/translate-disease/${diseaseId}?target_language=${langCode}`,
          {},
          { headers }
        );
        toast.success(`Translated to ${LANGUAGES.find(l => l.code === langCode)?.name}`);
        if (onTranslationComplete) {
          onTranslationComplete(langCode);
        }
      } catch (err) {
        console.error('Translation error:', err);
        toast.error('Translation failed. Please try again.');
      } finally {
        setTranslating(false);
      }
    }
    
    onLanguageChange(langCode);
  };

  const currentLang = LANGUAGES.find(l => l.code === currentLanguage) || LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          disabled={translating}
          data-testid="language-switcher"
        >
          {translating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{currentLang.flag} {currentLang.name}</span>
              <span className="sm:hidden">{currentLang.flag}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">
          Select Language
        </div>
        <DropdownMenuSeparator />
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center justify-between cursor-pointer"
            data-testid={`lang-${lang.code}`}
          >
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </span>
            {currentLanguage === lang.code && (
              <Check className="w-4 h-4 text-blue-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
