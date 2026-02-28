import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { MainLayout } from '../components/layout/MainLayout';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { RichTextEditor, AddTextBlock } from '../components/editor/RichTextEditor';
import { SectionMedia } from '../components/editor/SectionMedia';
import { DiseaseSearch } from '../components/DiseaseSearch';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Bookmark, BookmarkCheck, FileText, Edit, Pencil, Check, X,
  ArrowLeft, Save, Clock, Type, Plus, Loader2
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

export const DiseasePage = () => {
  const { id } = useParams();
  const { getAuthHeaders, isEditor } = useAuth();
  const { currentLanguage, t } = useLanguage();
  
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
  const [editingSection, setEditingSection] = useState(null);
  const [editedContent, setEditedContent] = useState({});
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const contentRef = useRef(null);
  const sectionRefs = useRef({});

  useEffect(() => {
    if (id) {
      fetchDisease();
      checkBookmark();
      fetchNote();
      recordView();
    }
  }, [id]);

  // Effect to handle language change - trigger translation if needed
  useEffect(() => {
    if (disease && currentLanguage !== 'en' && id) {
      // Check if translation exists for this language
      const hasTranslation = disease[`definition_${currentLanguage}`];
      if (!hasTranslation) {
        // Trigger translation
        translateToLanguage(currentLanguage);
      }
    }
  }, [currentLanguage, disease?.id]);

  const translateToLanguage = async (targetLang) => {
    if (!isEditor) return; // Only editors can trigger translation
    
    setTranslating(true);
    try {
      const headers = getAuthHeaders();
      await axios.post(
        `${API_URL}/translate-disease/${id}?target_language=${targetLang}`,
        {},
        { headers }
      );
      // Refresh disease data to get translations
      await fetchDisease();
      toast.success(`Translated to ${targetLang === 'pt' ? 'Portuguese' : 'Spanish'}`);
    } catch (err) {
      console.error('Translation error:', err);
      toast.error('Translation failed. Content shown in English.');
    } finally {
      setTranslating(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDisease();
      checkBookmark();
      fetchNote();
      recordView();
    }
  }, [id]);

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
      setEditedContent({});
      setHasChanges(false);
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

  const handleSectionEdit = (sectionId, value) => {
    setEditedContent(prev => ({
      ...prev,
      [sectionId]: value
    }));
    setHasChanges(true);
  };

  const handleSectionMediaChange = (sectionId, newMedia) => {
    setEditedContent(prev => ({
      ...prev,
      [`${sectionId}_media`]: newMedia
    }));
    setHasChanges(true);
  };

  const getSectionMedia = (sectionId) => {
    const mediaKey = `${sectionId}_media`;
    if (editedContent.hasOwnProperty(mediaKey)) {
      return editedContent[mediaKey];
    }
    return disease?.[mediaKey] || [];
  };

  const saveAllChanges = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      const updateData = { ...editedContent };
      
      // Save changes in current language
      await axios.put(`${API_URL}/diseases/${id}`, updateData, { headers });
      
      // Auto-translate to other languages
      setTranslating(true);
      toast.info('Auto-translating to other languages...');
      
      const otherLanguages = ['pt', 'es'].filter(l => l !== 'en');
      for (const lang of otherLanguages) {
        try {
          await axios.post(
            `${API_URL}/translate-disease/${id}?target_language=${lang}`,
            {},
            { headers }
          );
        } catch (err) {
          console.error(`Translation to ${lang} failed:`, err);
        }
      }
      
      setTranslating(false);
      
      // Refresh disease data
      await fetchDisease();
      toast.success('Changes saved and translated to all languages');
      setEditingSection(null);
    } catch (err) {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
      setTranslating(false);
    }
  };

  const discardChanges = () => {
    setEditedContent({});
    setHasChanges(false);
    setEditingSection(null);
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
        {/* Main Content - Full width */}
        <div className="w-full">
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
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">
                    {disease.category_name}
                  </Badge>
                </div>
                <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 dark:text-white" data-testid="disease-title">
                  {getDiseaseName()}
                </h1>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
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

            {/* Save Changes Bar */}
            {hasChanges && isEditor && (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
                <span className="text-sm text-blue-700 dark:text-blue-300">{t('youHaveUnsavedChanges')}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={discardChanges} disabled={saving || translating}>
                    <X className="w-4 h-4 mr-1" />
                    {t('discard')}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={saveAllChanges}
                    disabled={saving || translating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {(saving || translating) && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                    {!saving && !translating && <Save className="w-4 h-4 mr-1" />}
                    {saving ? t('saving') : translating ? t('translating') : t('saveAndTranslate')}
                  </Button>
                </div>
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
          <div className="disease-content w-full">
            {sections.map((section) => {
              const content = getCurrentContent(section.id);
              const sectionMedia = getSectionMedia(section.id);
              const isEditing = editingSection === section.id;
              
              // Skip empty sections in read mode (but show if has media)
              if (!isEditing && !content && sectionMedia.length === 0 && section.id !== 'references') return null;
              if (section.id === 'references' && Array.isArray(content) && content.length === 0 && !isEditing && sectionMedia.length === 0) return null;
              
              return (
                <div 
                  key={section.id} 
                  ref={el => sectionRefs.current[section.id] = el}
                  className="w-full mb-6"
                  data-testid={`section-${section.id}`}
                >
                  <div className="flex items-center justify-between group w-full mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white" id={section.id}>
                      {section.label}
                    </h3>
                    {isEditor && !isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setEditingSection(section.id)}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        {t('edit')}
                      </Button>
                    )}
                  </div>
                  
                  {/* Media positioned BEFORE text */}
                  <SectionMedia
                    media={sectionMedia}
                    onChange={(newMedia) => handleSectionMediaChange(section.id, newMedia)}
                    readOnly={!isEditor}
                    position="before"
                  />
                  
                  {isEditing && section.id !== 'references' ? (
                    <div className="mb-4">
                      <RichTextEditor
                        value={content}
                        onChange={(value) => handleSectionEdit(section.id, value)}
                        placeholder={`Enter ${section.label.toLowerCase()}...`}
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingSection(null)}
                        >
                          {t('done')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 clearfix w-full">
                      {/* Media positioned INLINE (left/right/center) */}
                      <SectionMedia
                        media={sectionMedia}
                        onChange={(newMedia) => handleSectionMediaChange(section.id, newMedia)}
                        readOnly={!isEditor}
                        position="inline"
                      />
                      <div className="w-full">
                        {renderSectionContent(section.id, content)}
                      </div>
                      
                      {/* Add more text button */}
                      {isEditor && section.id !== 'references' && (
                        <button
                          type="button"
                          onClick={() => handleAddMoreText(section.id)}
                          className="mt-3 w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg 
                                     flex items-center justify-center gap-2 text-slate-400 hover:text-blue-500 
                                     hover:border-blue-400 transition-colors text-sm"
                        >
                          <Type className="w-4 h-4" />
                          <span>{t('addMoreText')}</span>
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Media positioned AFTER text + Add button */}
                  <SectionMedia
                    media={sectionMedia}
                    onChange={(newMedia) => handleSectionMediaChange(section.id, newMedia)}
                    readOnly={!isEditor}
                    position="after"
                  />
                </div>
              );
            })}
          </div>

          {/* Version Info */}
          <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-400 flex items-center gap-4">
            <Clock className="w-4 h-4" />
            <span>Version {disease.version}</span>
            <span>•</span>
            <span>Last updated: {new Date(disease.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
