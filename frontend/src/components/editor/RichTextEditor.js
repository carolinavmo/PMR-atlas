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
  const [isInitialized, setIsInitialized] = useState(false);

  // Convert plain text with markdown markers to HTML for display
  const textToHtml = useCallback((text) => {
    if (!text) return '';
    
    let html = text
      // Escape HTML entities first
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Convert markdown-style markers to HTML (order matters!)
    // Bold: **text**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text*
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Underline: __text__
    html = html.replace(/__(.+?)__/g, '<u>$1</u>');
    
    // Handle bullet points and line breaks
    const lines = html.split('\n');
    let result = [];
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isBullet = line.startsWith('- ') || line.startsWith('• ');
      
      if (isBullet) {
        if (!inList) {
          result.push('<ul class="list-disc pl-6 my-2">');
          inList = true;
        }
        result.push(`<li>${line.substring(2)}</li>`);
      } else {
        if (inList) {
          result.push('</ul>');
          inList = false;
        }
        if (line.trim()) {
          result.push(`<div>${line}</div>`);
        } else {
          result.push('<div><br></div>');
        }
      }
    }
    
    if (inList) {
      result.push('</ul>');
    }
    
    return result.join('');
  }, []);

  // Convert HTML back to plain text with markdown markers
  const htmlToText = useCallback((html) => {
    if (!html) return '';
    
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
            return `- ${children}\n`;
          case 'ul':
          case 'ol':
            return children;
          case 'br':
            return '\n';
          case 'div':
          case 'p':
            return children + (children.endsWith('\n') ? '' : '\n');
          default:
            return children;
        }
      }
      return '';
    };
    
    let text = Array.from(temp.childNodes).map(processNode).join('');
    // Clean up: remove trailing newlines and multiple consecutive newlines
    text = text.replace(/\n{3,}/g, '\n\n').replace(/\n+$/, '');
    return text;
  }, []);

  // Initialize editor content only once
  useEffect(() => {
    if (editorRef.current && !isInitialized && value) {
      editorRef.current.innerHTML = textToHtml(value);
      setIsInitialized(true);
    }
  }, [value, textToHtml, isInitialized]);

  // Reset initialization when value changes externally (e.g., language switch)
  useEffect(() => {
    if (editorRef.current && isInitialized) {
      const currentText = htmlToText(editorRef.current.innerHTML);
      if (currentText !== value) {
        editorRef.current.innerHTML = textToHtml(value);
      }
    }
  }, [value]);

  const execCommand = (command, commandValue = null) => {
    // Save selection
    const selection = window.getSelection();
    const range = selection?.rangeCount > 0 ? selection.getRangeAt(0) : null;
    
    // Focus and execute
    editorRef.current?.focus();
    
    // Restore selection if we have one
    if (range) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    // Execute the command
    document.execCommand(command, false, commandValue);
    
    // Notify parent of change
    setTimeout(() => {
      if (editorRef.current && onChange) {
        const text = htmlToText(editorRef.current.innerHTML);
        onChange(text);
      }
    }, 0);
  };

  const handleInput = () => {
    if (editorRef.current && onChange) {
      const text = htmlToText(editorRef.current.innerHTML);
      onChange(text);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '    ');
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
          onMouseDown={(e) => e.preventDefault()}
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
          onMouseDown={(e) => e.preventDefault()}
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
          onMouseDown={(e) => e.preventDefault()}
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
          onMouseDown={(e) => e.preventDefault()}
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
          onMouseDown={(e) => e.preventDefault()}
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
          onMouseDown={(e) => e.preventDefault()}
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
          onMouseDown={(e) => e.preventDefault()}
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
                   text-slate-700 dark:text-slate-300 leading-relaxed
                   [&_strong]:font-bold [&_b]:font-bold
                   [&_em]:italic [&_i]:italic
                   [&_u]:underline
                   [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2
                   [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2
                   [&_li]:my-1
                   ${className}`}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
      
      {/* Placeholder style */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          display: block;
        }
        [contenteditable] strong, [contenteditable] b {
          font-weight: 700 !important;
        }
        [contenteditable] em, [contenteditable] i {
          font-style: italic !important;
        }
        [contenteditable] u {
          text-decoration: underline !important;
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
