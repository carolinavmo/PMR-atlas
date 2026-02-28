import { useRef, useCallback, useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Bold, Italic, Underline, List, ListOrdered, Undo, Redo } from 'lucide-react';

export const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Start typing...",
  className = "",
  readOnly = false 
}) => {
  const editorRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false
  });

  useEffect(() => {
    if (editorRef.current && !isEditing) {
      editorRef.current.innerHTML = formatTextToHtml(value || '');
    }
  }, [value, isEditing]);

  const formatTextToHtml = (text) => {
    if (!text) return '';
    // Convert line breaks to proper HTML
    return text
      .split('\n')
      .map(line => {
        if (line.startsWith('- ')) {
          return `<li>${line.substring(2)}</li>`;
        }
        return `<p>${line || '<br>'}</p>`;
      })
      .join('')
      .replace(/<li>/g, '<ul><li>')
      .replace(/<\/li>(?!<li>)/g, '</li></ul>');
  };

  const checkActiveFormats = useCallback(() => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline')
    });
  }, []);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    checkActiveFormats();
    handleContentChange();
  };

  const handleContentChange = () => {
    if (editorRef.current && onChange) {
      const html = editorRef.current.innerHTML;
      // Convert HTML back to plain text with formatting markers
      const text = htmlToText(html);
      onChange(text);
    }
  };

  const htmlToText = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Process the content
    let text = '';
    const processNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase();
        let content = Array.from(node.childNodes).map(processNode).join('');
        
        switch (tag) {
          case 'b':
          case 'strong':
            return `**${content}**`;
          case 'i':
          case 'em':
            return `*${content}*`;
          case 'u':
            return `__${content}__`;
          case 'li':
            return `- ${content}\n`;
          case 'br':
            return '\n';
          case 'p':
          case 'div':
            return content + '\n';
          default:
            return content;
        }
      }
      return '';
    };
    
    text = Array.from(tempDiv.childNodes).map(processNode).join('');
    return text.trim();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      execCommand('insertText', '    ');
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
    checkActiveFormats();
  };

  const handleBlur = () => {
    setIsEditing(false);
    handleContentChange();
  };

  if (readOnly) {
    return (
      <div 
        className={`rich-text-content section-content ${className}`}
        dangerouslySetInnerHTML={{ __html: formatTextToHtml(value || '') }}
      />
    );
  }

  return (
    <div className="rich-text-editor-wrapper">
      <div className="editor-toolbar">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          className={activeFormats.bold ? 'active' : ''}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          className={activeFormats.italic ? 'active' : ''}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('underline')}
          className={activeFormats.underline ? 'active' : ''}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </Button>
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertUnorderedList')}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertOrderedList')}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('undo')}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('redo')}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className={`rich-text-editor section-content p-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 ${className}`}
        onInput={handleContentChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSelect={checkActiveFormats}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
};
