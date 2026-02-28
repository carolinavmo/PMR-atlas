import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Bold, Italic, Underline, List, ListOrdered, Undo, Redo, Type } from 'lucide-react';

export const RichTextEditor = ({ 
  value = '', 
  onChange, 
  placeholder = "Start typing...",
  className = "",
  readOnly = false 
}) => {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Convert plain text with markers to HTML for display
  const textToHtml = useCallback((text) => {
    if (!text) return '';
    
    let html = text
      // Escape HTML first
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Convert markdown-style markers to HTML
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/__(.+?)__/g, '<u>$1</u>')
      // Convert line breaks
      .replace(/\n/g, '<br>');
    
    // Handle bullet points
    const lines = html.split('<br>');
    let inList = false;
    let result = [];
    
    for (const line of lines) {
      if (line.startsWith('- ') || line.startsWith('• ')) {
        if (!inList) {
          result.push('<ul>');
          inList = true;
        }
        result.push(`<li>${line.substring(2)}</li>`);
      } else {
        if (inList) {
          result.push('</ul>');
          inList = false;
        }
        result.push(line || '<br>');
      }
    }
    if (inList) result.push('</ul>');
    
    return result.join('');
  }, []);

  // Convert HTML back to plain text with markers
  const htmlToText = useCallback((html) => {
    if (!html) return '';
    
    // Create temp element to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    const processNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const children = Array.from(node.childNodes).map(processNode).join('');
        const tag = node.tagName.toLowerCase();
        
        switch (tag) {
          case 'strong':
          case 'b':
            return `**${children}**`;
          case 'em':
          case 'i':
            return `*${children}*`;
          case 'u':
            return `__${children}__`;
          case 'li':
            return `- ${children}`;
          case 'ul':
          case 'ol':
            return children;
          case 'br':
            return '\n';
          case 'div':
          case 'p':
            return children + '\n';
          default:
            return children;
        }
      }
      return '';
    };
    
    let text = Array.from(temp.childNodes).map(processNode).join('');
    // Clean up multiple newlines
    text = text.replace(/\n{3,}/g, '\n\n').trim();
    return text;
  }, []);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && !isFocused) {
      const html = textToHtml(value);
      if (editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html || '';
      }
    }
  }, [value, textToHtml, isFocused]);

  const execCommand = (command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    // Trigger change after command
    setTimeout(() => {
      if (editorRef.current && onChange) {
        const text = htmlToText(editorRef.current.innerHTML);
        onChange(text);
      }
    }, 10);
  };

  const handleInput = () => {
    if (editorRef.current && onChange) {
      const text = htmlToText(editorRef.current.innerHTML);
      onChange(text);
    }
  };

  const handleKeyDown = (e) => {
    // Handle tab key
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '    ');
    }
    // Handle enter in list
    if (e.key === 'Enter' && !e.shiftKey) {
      const selection = window.getSelection();
      const node = selection?.anchorNode?.parentElement;
      if (node?.tagName === 'LI') {
        // Continue list behavior naturally
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  if (readOnly) {
    return (
      <div 
        className={`section-content rich-text-content ${className}`}
        dangerouslySetInnerHTML={{ __html: textToHtml(value) }}
      />
    );
  }

  return (
    <div className="rich-text-editor-wrapper">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-t-lg border border-b-0 border-slate-200 dark:border-slate-700">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('underline')}
          className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
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
          className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertOrderedList')}
          className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
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
          className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('redo')}
          className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        className={`min-h-[120px] p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-b-lg 
                   focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                   text-slate-700 dark:text-slate-300 leading-relaxed ${className}`}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        data-placeholder={placeholder}
        suppressContentEditableWarning
        style={{ whiteSpace: 'pre-wrap' }}
      />
      
      {/* Placeholder */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

// Simple add text block component
export const AddTextBlock = ({ onAdd }) => {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="mt-2 w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg 
                 flex items-center justify-center gap-2 text-slate-400 hover:text-blue-500 
                 hover:border-blue-400 transition-colors text-sm"
    >
      <Type className="w-4 h-4" />
      <span>Add more text</span>
    </button>
  );
};
