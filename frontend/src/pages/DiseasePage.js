import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { MainLayout } from '../components/layout/MainLayout';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { RichTextEditor, AddTextBlock } from '../components/editor/RichTextEditor';
import { SectionMedia } from '../components/editor/SectionMedia';
import { DiseaseSearch } from '../components/DiseaseSearch';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Bookmark, BookmarkCheck, FileText, Edit, Pencil, Check, X,
  ArrowLeft, Save, Clock, Type, Plus, Loader2, Globe, AlertTriangle
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Section definitions with translation keys
const sectionDefs = [
  { id: 'definition', key: 'definition' },
  { id: 'epidemiology', key: 'epidemiology' },
  { id: 'pathophysiology', key: 'pathophysiology' },
  { id: 'biomechanics', key: 'biomechanics' },
  { id: 'clinical_presentation', key: 'clinicalPresentation' },
  { id: 'physical_examination', key: 'physicalExamination' },
  { id: 'imaging_findings', key: 'imagingFindings' },
  { id: 'differential_diagnosis', key: 'differentialDiagnosis' },
  { id: 'treatment_conservative', key: 'conservativeTreatment' },
  { id: 'treatment_interventional', key: 'interventionalTreatment' },
  { id: 'treatment_surgical', key: 'surgicalTreatment' },
  { id: 'rehabilitation_protocol', key: 'rehabilitationProtocol' },
  { id: 'prognosis', key: 'prognosis' },
  { id: 'references', key: 'references' },
];

const LANGUAGE_NAMES = {
  en: 'English',
  pt: 'Português',
  es: 'Español'
};

export const DiseasePage = () => {
  const { id } = useParams();
  const { getAuthHeaders, isAdmin } = useAuth();
  const { currentLanguage, t, languages } = useLanguage();
  
  // Generate sections with translated labels
  const sections = sectionDefs.map(s => ({
    id: s.id,
    label: t(s.key)
  }));
  
  const [disease, setDisease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [note, setNote] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [activeSection, setActiveSection] = useState('definition');
  
  // Inline editing state
  const [editMode, setEditMode] = useState(false);
  const [editedFields, setEditedFields] = useState({});
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [showTranslateConfirm, setShowTranslateConfirm] = useState(false);

  const contentRef = useRef(null);
  const sectionRefs = useRef({});

  useEffect(() => {
    if (id) {
      fetchDisease();
      checkBookmark();
      fetchNote();
      recordView();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Reset edit mode when language changes
  useEffect(() => {
    if (editMode) {
      // When switching language, reload the editable fields for the new language
      initializeEditFields();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLanguage]);

  // Initialize editable fields with current content
  const initializeEditFields = useCallback(() => {
    if (!disease) return;
    
    const fields = {};
    sectionDefs.forEach(s => {
      if (s.id === 'references') return; // Skip references for now
      fields[s.id] = getCurrentContent(s.id) || '';
    });
    fields['name'] = getDiseaseName() || '';
    setEditedFields(fields);
  }, [disease, currentLanguage]);

  // Enter edit mode
  const enterEditMode = () => {
    initializeEditFields();
    setEditMode(true);
  };

  // Exit edit mode without saving
  const cancelEditMode = () => {
    setEditMode(false);
    setEditedFields({});
  };

  // Handle field change
  const handleFieldChange = (fieldId, value) => {
    setEditedFields(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Save only the current language
  const saveCurrentLanguageOnly = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      await axios.put(
        `${API_URL}/diseases/${id}/inline-save`,
        {
          language: currentLanguage,
          fields: editedFields
        },
        { headers }
      );
      
      await fetchDisease();
      setEditMode(false);
      setEditedFields({});
      toast.success(`Saved in ${LANGUAGE_NAMES[currentLanguage]}`);
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Save and translate to other languages
  const saveAndTranslate = async () => {
    setShowTranslateConfirm(false);
    setSaving(true);
    setTranslating(true);
    
    try {
      const headers = getAuthHeaders();
      const targetLanguages = languages.map(l => l.code).filter(c => c !== currentLanguage);
      
      await axios.put(
        `${API_URL}/diseases/${id}/inline-save-translate`,
        {
          source_language: currentLanguage,
          fields: editedFields,
          target_languages: [...targetLanguages, currentLanguage]
        },
        { headers }
      );
      
      await fetchDisease();
      setEditMode(false);
      setEditedFields({});
      toast.success(`Saved and translated to all languages`);
    } catch (err) {
      console.error('Save & translate error:', err);
      toast.error('Failed to save and translate');
    } finally {
      setSaving(false);
      setTranslating(false);
    }
  };

  // Scroll spy for TOC
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const scrollPosition = window.scrollY + 150;
      
      for (const section of sections) {
        const element = sectionRefs.current[section.id];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [disease]);

  const fetchDisease = async () => {
    try {
      const response = await axios.get(`${API_URL}/diseases/${id}`);
      setDisease(response.data);
    } catch (err) {
      console.error('Failed to fetch disease:', err);
      toast.error('Failed to load disease');
    } finally {
      setLoading(false);
    }
  };

  const checkBookmark = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/bookmarks`, { headers });
      const bookmarked = response.data.some(b => b.disease_id === id);
      setIsBookmarked(bookmarked);
    } catch (err) {
      console.error('Failed to check bookmark:', err);
    }
  };

  const fetchNote = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/notes/${id}`, { headers });
      if (response.data) {
        setNote(response.data.content);
      }
    } catch (err) {
      // No note exists
    }
  };

  const recordView = async () => {
    try {
      const headers = getAuthHeaders();
      await axios.post(`${API_URL}/recent-views/${id}`, {}, { headers });
    } catch (err) {
      console.error('Failed to record view:', err);
    }
  };

  const toggleBookmark = async () => {
    try {
      const headers = getAuthHeaders();
      if (isBookmarked) {
        await axios.delete(`${API_URL}/bookmarks/${id}`, { headers });
        setIsBookmarked(false);
        toast.success('Bookmark removed');
      } else {
        await axios.post(`${API_URL}/bookmarks`, { disease_id: id }, { headers });
        setIsBookmarked(true);
        toast.success('Disease bookmarked');
      }
    } catch (err) {
      toast.error('Failed to update bookmark');
    }
  };

  const saveNote = async () => {
    setSavingNote(true);
    try {
      const headers = getAuthHeaders();
      await axios.post(`${API_URL}/notes`, {
        disease_id: id,
        content: note
      }, { headers });
      toast.success('Note saved');
    } catch (err) {
      toast.error('Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  const getSectionMedia = (sectionId) => {
    const mediaKey = `${sectionId}_media`;
    return disease?.[mediaKey] || [];
  };

  const scrollToSection = (sectionId) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  const getTagClass = (tag) => {
    const tagClasses = {
      acute: 'tag-badge acute',
      chronic: 'tag-badge chronic',
      traumatic: 'tag-badge traumatic',
      degenerative: 'tag-badge degenerative',
      neurological: 'tag-badge neurological',
      developmental: 'tag-badge developmental',
      neuropathic: 'tag-badge neuropathic',
      compressive: 'tag-badge compressive',
    };
    return tagClasses[tag] || 'tag-badge';
  };

  const getCurrentContent = (sectionId) => {
    // Check edited content first
    if (editedContent.hasOwnProperty(sectionId)) {
      return editedContent[sectionId];
    }
    
    // For non-English, check for translated content
    if (currentLanguage !== 'en') {
      const translatedKey = `${sectionId}_${currentLanguage}`;
      if (disease?.[translatedKey]) {
        return disease[translatedKey];
      }
    }
    
    // Default to original content
    if (sectionId === 'references') {
      return disease?.references || [];
    }
    return disease?.[sectionId] || '';
  };

  const getDiseaseName = () => {
    if (currentLanguage !== 'en') {
      const translatedName = disease?.[`name_${currentLanguage}`];
      if (translatedName) return translatedName;
    }
    return disease?.name || '';
  };

  const handleAddMoreText = (sectionId) => {
    const currentContent = getCurrentContent(sectionId);
    const newContent = currentContent ? `${currentContent}\n\n` : '';
    setEditedContent(prev => ({
      ...prev,
      [sectionId]: newContent
    }));
    setEditingSection(sectionId);
    setHasChanges(true);
  };

  // Convert markdown text to JSX with formatting
  const parseFormattedText = (text) => {
    if (!text) return text;
    
    // Process the text to convert markdown markers to HTML
    let html = text
      // Bold: **text**
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic: *text*
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Underline: __text__
      .replace(/__(.+?)__/g, '<u>$1</u>');
    
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const renderSectionContent = (sectionId, content) => {
    if (!content) return <p className="text-slate-400 italic">{t('noInformationAvailable')}</p>;
    
    // Handle array content (references)
    if (Array.isArray(content)) {
      if (content.length === 0) return <p className="text-slate-400 italic">{t('noReferences')}</p>;
      return (
        <ol className="list-decimal list-inside space-y-2">
          {content.map((item, i) => (
            <li key={i} className="text-slate-600 dark:text-slate-400">{parseFormattedText(item)}</li>
          ))}
        </ol>
      );
    }
    
    // Handle string content with line breaks and lists
    // Only treat "- " at the START of a line as a bullet (not "-" in the middle)
    const lines = content.split('\n');
    
    return (
      <div className="section-content">
        {lines.map((line, i) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return null; // Skip empty lines
          
          // Only treat as bullet if line STARTS with "- " or "• " (bullet char + space)
          // This allows using "-" without space or in the middle of text
          const isBullet = /^[-•]\s/.test(trimmedLine);
          
          if (isBullet) {
            return (
              <div key={i} className="flex gap-2 mb-1">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{parseFormattedText(trimmedLine.substring(2))}</span>
              </div>
            );
          }
          return (
            <p key={i} className="mb-2">
              {parseFormattedText(line)}
            </p>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!disease) {
    return (
      <MainLayout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-heading font-bold mb-2">Disease Not Found</h2>
          <p className="text-slate-500 mb-4">The disease you're looking for doesn't exist.</p>
          <Link to="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="relative" data-testid="disease-page" ref={contentRef}>
        {/* Floating Table of Contents - Fixed on right */}
        <div className="hidden xl:block fixed right-6 top-24 w-48 z-20">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 shadow-lg max-h-[calc(100vh-120px)] overflow-auto">
            <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
              {t('onThisPage')}
            </h3>
            <nav className="space-y-0.5">
              {sections.map((section) => {
                const content = getCurrentContent(section.id);
                const sectionMedia = getSectionMedia(section.id);
                if (section.id !== 'references' && !content && sectionMedia.length === 0) return null;
                if (section.id === 'references' && Array.isArray(content) && content.length === 0 && sectionMedia.length === 0) return null;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left text-xs px-2 py-1.5 rounded transition-colors ${
                      activeSection === section.id 
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content - Full width with right margin for TOC on xl screens */}
        <div className="w-full xl:pr-52">
          {/* Back Button and Disease Search */}
          <div className="flex items-center justify-between gap-4 mb-4 w-full">
            <Link to="/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t('backToDashboard')}
            </Link>
            <DiseaseSearch currentDiseaseId={id} />
          </div>

          {/* Header - More Compact */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">
                    {disease.category_name}
                  </Badge>
                  {/* Language indicator */}
                  <Badge variant="secondary" className="text-xs">
                    <Globe className="w-3 h-3 mr-1" />
                    {LANGUAGE_NAMES[currentLanguage]}
                  </Badge>
                  {editMode && (
                    <Badge className="bg-amber-100 text-amber-700 text-xs">
                      <Pencil className="w-3 h-3 mr-1" />
                      Editing
                    </Badge>
                  )}
                </div>
                {/* Editable title */}
                {editMode ? (
                  <input
                    type="text"
                    value={editedFields.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 dark:text-white bg-transparent border-b-2 border-blue-400 focus:outline-none focus:border-blue-600 w-full"
                    data-testid="disease-title-edit"
                  />
                ) : (
                  <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 dark:text-white" data-testid="disease-title">
                    {getDiseaseName()}
                  </h1>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Admin Edit Button */}
                {isAdmin && !editMode && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={enterEditMode}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="edit-mode-btn"
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleBookmark}
                  className={isBookmarked ? 'text-amber-600 border-amber-300' : ''}
                  data-testid="bookmark-btn"
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="w-4 h-4 mr-1" />
                  ) : (
                    <Bookmark className="w-4 h-4 mr-1" />
                  )}
                  {t('save')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotes(!showNotes)}
                  data-testid="notes-toggle"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  {t('notes')}
                </Button>
              </div>
            </div>

            {/* Edit Mode Save Bar - Only for Admins */}
            {editMode && isAdmin && (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    Editing in <strong>{LANGUAGE_NAMES[currentLanguage]}</strong>
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={cancelEditMode}
                    disabled={saving || translating}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm" 
                    onClick={saveCurrentLanguageOnly}
                    disabled={saving || translating}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    data-testid="save-single-lang-btn"
                  >
                    {saving && !translating && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                    {!saving && <Save className="w-4 h-4 mr-1" />}
                    Save {LANGUAGE_NAMES[currentLanguage]} Only
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => setShowTranslateConfirm(true)}
                    disabled={saving || translating}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="save-translate-btn"
                  >
                    {translating && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                    {!translating && <Globe className="w-4 h-4 mr-1" />}
                    {translating ? 'Translating...' : 'Save + Translate All'}
                  </Button>
                </div>
              </div>
            )}

            {/* Tags */}
            {disease.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {disease.tags.map((tag) => (
                  <span key={tag} className={getTagClass(tag)} data-testid={`tag-${tag}`}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes Panel */}
          {showNotes && (
            <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700" data-testid="notes-panel">
              <h3 className="text-lg font-heading font-semibold mb-3">{t('yourNotesForThisDisease')}</h3>
              <Textarea
                placeholder={t('writeYourNotesHere')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[120px] mb-3 bg-white dark:bg-slate-900"
                data-testid="notes-textarea"
              />
              <Button 
                onClick={saveNote} 
                disabled={savingNote}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="save-notes-btn"
              >
                {savingNote ? t('saving') : t('saveNote')}
              </Button>
            </div>
          )}

          {/* Continuous Content Sections - Full Width */}
          <div>
            {sections.map((section) => {
              const content = getCurrentContent(section.id);
              const sectionMedia = getSectionMedia(section.id);
              
              // In edit mode, always show sections (even empty ones)
              // In view mode, skip empty sections
              if (!editMode && !content && sectionMedia.length === 0 && section.id !== 'references') return null;
              if (!editMode && section.id === 'references' && Array.isArray(content) && content.length === 0 && sectionMedia.length === 0) return null;
              
              return (
                <div 
                  key={section.id} 
                  ref={el => sectionRefs.current[section.id] = el}
                  className={`w-full mb-6 ${editMode ? 'p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900' : ''}`}
                  data-testid={`section-${section.id}`}
                >
                  <div className="flex items-center justify-between group w-full mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white" id={section.id}>
                      {section.label}
                    </h3>
                    {editMode && (
                      <span className="text-xs text-slate-400">
                        {LANGUAGE_NAMES[currentLanguage]}
                      </span>
                    )}
                  </div>
                  
                  {/* Section Content - Edit Mode vs View Mode */}
                  {editMode && section.id !== 'references' ? (
                    <div className="mb-4">
                      <Textarea
                        value={editedFields[section.id] || ''}
                        onChange={(e) => handleFieldChange(section.id, e.target.value)}
                        placeholder={`Enter ${section.label.toLowerCase()}...`}
                        className="min-h-[150px] bg-white dark:bg-slate-800 border-blue-300 focus:border-blue-500"
                        data-testid={`edit-${section.id}`}
                      />
                    </div>
                  ) : (
                    <div className="mb-4 clearfix w-full">
                      {/* Media */}
                      <SectionMedia
                        media={sectionMedia}
                        onChange={(newMedia) => handleSectionMediaChange(section.id, newMedia)}
                        readOnly={!isAdmin}
                        position="inline"
                      />
                      <div className="w-full">
                        {renderSectionContent(section.id, content)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Translate Confirmation Dialog */}
          <Dialog open={showTranslateConfirm} onOpenChange={setShowTranslateConfirm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Confirm Translation
                </DialogTitle>
                <DialogDescription>
                  This will translate the content from <strong>{LANGUAGE_NAMES[currentLanguage]}</strong> to all other languages.
                  <br /><br />
                  <span className="text-amber-600 dark:text-amber-400">
                    Warning: This will overwrite any existing content in other languages.
                  </span>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTranslateConfirm(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={saveAndTranslate}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Globe className="w-4 h-4 mr-1" />
                  Yes, Save & Translate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Version Info */}
          <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-400 flex items-center gap-4">
            <Clock className="w-4 h-4" />
            <span>Version {disease.version}</span>
            <span>•</span>
            <span>Last updated: {new Date(disease.updated_at).toLocaleDateString()}</span>
            {disease.last_edited_language && (
              <>
                <span>•</span>
                <span>Last edited in: {LANGUAGE_NAMES[disease.last_edited_language] || disease.last_edited_language}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
