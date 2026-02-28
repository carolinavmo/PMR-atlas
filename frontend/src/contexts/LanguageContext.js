import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const LanguageContext = createContext();

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

const VALID_LANG_CODES = LANGUAGES.map(l => l.code);

// Helper to extract language from URL path
const extractLangFromPath = (pathname) => {
  const match = pathname.match(/^\/(en|pt|es)(\/|$)/);
  return match ? match[1] : null;
};

// Helper to remove language prefix from path
const removeLanguagePrefix = (pathname) => {
  return pathname.replace(/^\/(en|pt|es)/, '') || '/';
};

// Helper to add language prefix to path
const addLanguagePrefix = (pathname, lang) => {
  const cleanPath = removeLanguagePrefix(pathname);
  return `/${lang}${cleanPath === '/' ? '' : cleanPath}`;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('pmr_language') || 'en';
  });
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem('pmr_language', currentLanguage);
  }, [currentLanguage]);

  const setLanguage = useCallback((code) => {
    if (VALID_LANG_CODES.includes(code) && code !== currentLanguage) {
      setIsChangingLanguage(true);
      setCurrentLanguage(code);
      // Reset flag after a short delay to allow re-renders
      setTimeout(() => setIsChangingLanguage(false), 100);
    }
  }, [currentLanguage]);

  const toggleLanguage = useCallback(() => {
    const currentIndex = LANGUAGES.findIndex(l => l.code === currentLanguage);
    const nextIndex = (currentIndex + 1) % LANGUAGES.length;
    setLanguage(LANGUAGES[nextIndex].code);
  }, [currentLanguage, setLanguage]);

  const getCurrentLanguageInfo = useCallback(() => {
    return LANGUAGES.find(l => l.code === currentLanguage) || LANGUAGES[0];
  }, [currentLanguage]);

  const getNextLanguageInfo = useCallback(() => {
    const currentIndex = LANGUAGES.findIndex(l => l.code === currentLanguage);
    const nextIndex = (currentIndex + 1) % LANGUAGES.length;
    return LANGUAGES[nextIndex];
  }, [currentLanguage]);

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      setLanguage,
      toggleLanguage,
      getCurrentLanguageInfo,
      getNextLanguageInfo,
      languages: LANGUAGES,
      isChangingLanguage
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export { LANGUAGES };
