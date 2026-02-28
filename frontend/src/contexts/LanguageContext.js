import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LanguageContext = createContext();

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },  // Portugal flag
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

const VALID_LANG_CODES = LANGUAGES.map(l => l.code);

// UI Translations for the entire website
const UI_TRANSLATIONS = {
  en: {
    // Navigation & Layout
    dashboard: 'Dashboard',
    bookmarks: 'Bookmarks',
    myNotes: 'My Notes',
    recentlyViewed: 'Recently Viewed',
    adminPanel: 'Admin Panel',
    categories: 'Categories',
    searchDiseases: 'Search diseases...',
    logout: 'Log out',
    
    // Dashboard
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    welcomeBack: 'Welcome back',
    continueYourLearning: 'Continue your learning journey with our comprehensive PMR disease database.',
    exploreDiseases: 'Explore Diseases',
    totalDiseases: 'Total Diseases',
    recentViews: 'Recent Views',
    yourBookmarks: 'Your Bookmarks',
    noBookmarksYet: 'No bookmarks yet',
    saveDiseasesForQuickAccess: 'Save diseases for quick access',
    viewAll: 'View all',
    
    // Disease Page
    backToDashboard: 'Back to Dashboard',
    quickSwitchToAnotherDisease: 'Quick switch to another disease...',
    save: 'Save',
    notes: 'Notes',
    onThisPage: 'ON THIS PAGE',
    definition: 'Definition',
    epidemiology: 'Epidemiology',
    pathophysiology: 'Pathophysiology',
    biomechanics: 'Biomechanics',
    clinicalPresentation: 'Clinical Presentation',
    physicalExamination: 'Physical Examination',
    imagingFindings: 'Imaging Findings',
    differentialDiagnosis: 'Differential Diagnosis',
    conservativeTreatment: 'Conservative Treatment',
    interventionalTreatment: 'Interventional Treatment',
    surgicalTreatment: 'Surgical Treatment',
    rehabilitationProtocol: 'Rehabilitation Protocol',
    prognosis: 'Prognosis',
    references: 'References',
    
    // Editing
    edit: 'Edit',
    done: 'Done',
    cancel: 'Cancel',
    addMoreText: 'Add more text',
    addMediaToThisSection: 'Add media to this section',
    youHaveUnsavedChanges: 'You have unsaved changes',
    discard: 'Discard',
    saveAndTranslate: 'Save & Translate',
    saving: 'Saving...',
    translating: 'Translating...',
    
    // Notes
    yourNotesForThisDisease: 'Your notes for this disease',
    writeYourNotesHere: 'Write your notes here...',
    saveNote: 'Save Note',
    
    // Auth
    welcomeBackLogin: 'Welcome back',
    signInToAccess: 'Sign in to access your learning dashboard',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign in',
    signingIn: 'Signing in...',
    dontHaveAccount: "Don't have an account?",
    createOne: 'Create one',
    demoAdminAccount: 'Demo Admin Account',
    
    // Language
    selectLanguage: 'Select Language',
    
    // Admin
    manageContent: 'Manage Content',
    diseasesManagement: 'Diseases',
    categoriesManagement: 'Categories',
    addNewDisease: 'Add New Disease',
    addNewCategory: 'Add New Category',
    dragToReorder: 'Drag to reorder',
    
    // Misc
    noInformationAvailable: 'No information available',
    noReferences: 'No references',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },
  pt: {
    // Navigation & Layout
    dashboard: 'Painel',
    bookmarks: 'Favoritos',
    myNotes: 'As Minhas Notas',
    recentlyViewed: 'Vistos Recentemente',
    adminPanel: 'Painel de Administração',
    categories: 'Categorias',
    searchDiseases: 'Pesquisar doenças...',
    logout: 'Terminar sessão',
    
    // Dashboard
    goodMorning: 'Bom dia',
    goodAfternoon: 'Boa tarde',
    goodEvening: 'Boa noite',
    welcomeBack: 'Bem-vindo de volta',
    continueYourLearning: 'Continue a sua jornada de aprendizagem com a nossa base de dados abrangente de doenças de MFR.',
    exploreDiseases: 'Explorar Doenças',
    totalDiseases: 'Total de Doenças',
    recentViews: 'Visualizações Recentes',
    yourBookmarks: 'Os Seus Favoritos',
    noBookmarksYet: 'Ainda sem favoritos',
    saveDiseasesForQuickAccess: 'Guarde doenças para acesso rápido',
    viewAll: 'Ver tudo',
    
    // Disease Page
    backToDashboard: 'Voltar ao Painel',
    quickSwitchToAnotherDisease: 'Mudar rapidamente para outra doença...',
    save: 'Guardar',
    notes: 'Notas',
    onThisPage: 'NESTA PÁGINA',
    definition: 'Definição',
    epidemiology: 'Epidemiologia',
    pathophysiology: 'Fisiopatologia',
    biomechanics: 'Biomecânica',
    clinicalPresentation: 'Apresentação Clínica',
    physicalExamination: 'Exame Físico',
    imagingFindings: 'Achados Imagiológicos',
    differentialDiagnosis: 'Diagnóstico Diferencial',
    conservativeTreatment: 'Tratamento Conservador',
    interventionalTreatment: 'Tratamento Intervencionista',
    surgicalTreatment: 'Tratamento Cirúrgico',
    rehabilitationProtocol: 'Protocolo de Reabilitação',
    prognosis: 'Prognóstico',
    references: 'Referências',
    
    // Editing
    edit: 'Editar',
    done: 'Concluído',
    cancel: 'Cancelar',
    addMoreText: 'Adicionar mais texto',
    addMediaToThisSection: 'Adicionar média a esta secção',
    youHaveUnsavedChanges: 'Tem alterações não guardadas',
    discard: 'Descartar',
    saveAndTranslate: 'Guardar e Traduzir',
    saving: 'A guardar...',
    translating: 'A traduzir...',
    
    // Notes
    yourNotesForThisDisease: 'As suas notas para esta doença',
    writeYourNotesHere: 'Escreva as suas notas aqui...',
    saveNote: 'Guardar Nota',
    
    // Auth
    welcomeBackLogin: 'Bem-vindo de volta',
    signInToAccess: 'Inicie sessão para aceder ao seu painel de aprendizagem',
    email: 'Email',
    password: 'Palavra-passe',
    signIn: 'Iniciar sessão',
    signingIn: 'A iniciar sessão...',
    dontHaveAccount: 'Não tem uma conta?',
    createOne: 'Criar uma',
    demoAdminAccount: 'Conta de Administrador Demo',
    
    // Language
    selectLanguage: 'Selecionar Idioma',
    
    // Admin
    manageContent: 'Gerir Conteúdo',
    diseasesManagement: 'Doenças',
    categoriesManagement: 'Categorias',
    addNewDisease: 'Adicionar Nova Doença',
    addNewCategory: 'Adicionar Nova Categoria',
    dragToReorder: 'Arrastar para reordenar',
    
    // Misc
    noInformationAvailable: 'Informação não disponível',
    noReferences: 'Sem referências',
    loading: 'A carregar...',
    error: 'Erro',
    success: 'Sucesso',
  },
  es: {
    // Navigation & Layout
    dashboard: 'Panel',
    bookmarks: 'Marcadores',
    myNotes: 'Mis Notas',
    recentlyViewed: 'Vistos Recientemente',
    adminPanel: 'Panel de Administración',
    categories: 'Categorías',
    searchDiseases: 'Buscar enfermedades...',
    logout: 'Cerrar sesión',
    
    // Dashboard
    goodMorning: 'Buenos días',
    goodAfternoon: 'Buenas tardes',
    goodEvening: 'Buenas noches',
    welcomeBack: 'Bienvenido de nuevo',
    continueYourLearning: 'Continúa tu viaje de aprendizaje con nuestra completa base de datos de enfermedades de MFR.',
    exploreDiseases: 'Explorar Enfermedades',
    totalDiseases: 'Total de Enfermedades',
    recentViews: 'Vistas Recientes',
    yourBookmarks: 'Tus Marcadores',
    noBookmarksYet: 'Sin marcadores aún',
    saveDiseasesForQuickAccess: 'Guarda enfermedades para acceso rápido',
    viewAll: 'Ver todo',
    
    // Disease Page
    backToDashboard: 'Volver al Panel',
    quickSwitchToAnotherDisease: 'Cambiar rápidamente a otra enfermedad...',
    save: 'Guardar',
    notes: 'Notas',
    onThisPage: 'EN ESTA PÁGINA',
    definition: 'Definición',
    epidemiology: 'Epidemiología',
    pathophysiology: 'Fisiopatología',
    biomechanics: 'Biomecánica',
    clinicalPresentation: 'Presentación Clínica',
    physicalExamination: 'Examen Físico',
    imagingFindings: 'Hallazgos de Imagen',
    differentialDiagnosis: 'Diagnóstico Diferencial',
    conservativeTreatment: 'Tratamiento Conservador',
    interventionalTreatment: 'Tratamiento Intervencionista',
    surgicalTreatment: 'Tratamiento Quirúrgico',
    rehabilitationProtocol: 'Protocolo de Rehabilitación',
    prognosis: 'Pronóstico',
    references: 'Referencias',
    
    // Editing
    edit: 'Editar',
    done: 'Hecho',
    cancel: 'Cancelar',
    addMoreText: 'Añadir más texto',
    addMediaToThisSection: 'Añadir media a esta sección',
    youHaveUnsavedChanges: 'Tienes cambios sin guardar',
    discard: 'Descartar',
    saveAndTranslate: 'Guardar y Traducir',
    saving: 'Guardando...',
    translating: 'Traduciendo...',
    
    // Notes
    yourNotesForThisDisease: 'Tus notas para esta enfermedad',
    writeYourNotesHere: 'Escribe tus notas aquí...',
    saveNote: 'Guardar Nota',
    
    // Auth
    welcomeBackLogin: 'Bienvenido de nuevo',
    signInToAccess: 'Inicia sesión para acceder a tu panel de aprendizaje',
    email: 'Correo electrónico',
    password: 'Contraseña',
    signIn: 'Iniciar sesión',
    signingIn: 'Iniciando sesión...',
    dontHaveAccount: '¿No tienes una cuenta?',
    createOne: 'Crear una',
    demoAdminAccount: 'Cuenta de Administrador Demo',
    
    // Language
    selectLanguage: 'Seleccionar Idioma',
    
    // Admin
    manageContent: 'Gestionar Contenido',
    diseasesManagement: 'Enfermedades',
    categoriesManagement: 'Categorías',
    addNewDisease: 'Añadir Nueva Enfermedad',
    addNewCategory: 'Añadir Nueva Categoría',
    dragToReorder: 'Arrastrar para reordenar',
    
    // Misc
    noInformationAvailable: 'Información no disponible',
    noReferences: 'Sin referencias',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('pmr_language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('pmr_language', currentLanguage);
  }, [currentLanguage]);

  const setLanguage = useCallback((code) => {
    if (VALID_LANG_CODES.includes(code) && code !== currentLanguage) {
      setCurrentLanguage(code);
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

  // Translation function - t('key') returns translated string
  const t = useCallback((key) => {
    const translations = UI_TRANSLATIONS[currentLanguage] || UI_TRANSLATIONS.en;
    return translations[key] || UI_TRANSLATIONS.en[key] || key;
  }, [currentLanguage]);

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      setLanguage,
      toggleLanguage,
      getCurrentLanguageInfo,
      languages: LANGUAGES,
      t, // Translation function
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

export { LANGUAGES, UI_TRANSLATIONS };
