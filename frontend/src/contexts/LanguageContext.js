import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    // Get saved language from localStorage or default to 'en'
    return localStorage.getItem('pmr_language') || 'en';
  });

  useEffect(() => {
    // Save language preference
    localStorage.setItem('pmr_language', currentLanguage);
  }, [currentLanguage]);

  const toggleLanguage = () => {
    const currentIndex = LANGUAGES.findIndex(l => l.code === currentLanguage);
    const nextIndex = (currentIndex + 1) % LANGUAGES.length;
    setCurrentLanguage(LANGUAGES[nextIndex].code);
  };

  const setLanguage = (code) => {
    if (LANGUAGES.some(l => l.code === code)) {
      setCurrentLanguage(code);
    }
  };

  const getCurrentLanguageInfo = () => {
    return LANGUAGES.find(l => l.code === currentLanguage) || LANGUAGES[0];
  };

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      setLanguage,
      toggleLanguage,
      getCurrentLanguageInfo,
      languages: LANGUAGES
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
