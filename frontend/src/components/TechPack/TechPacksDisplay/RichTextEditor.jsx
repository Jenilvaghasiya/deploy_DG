// RichTextEditor.jsx - Complete custom implementation
import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Eraser } from 'lucide-react';
import './RichTextEditor.css';

export function RichTextEditor({ value, onChange, placeholder, className }) {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const isUpdating = useRef(false);  // ✅ NEW: Flag to prevent loops from programmatic updates

  useEffect(() => {
    if (editorRef.current && !isFocused && value !== undefined) {
      try {
        isUpdating.current = true;  // ✅ Set flag before DOM change
        const newHtml = value || '';
        if (editorRef.current.innerHTML !== newHtml) {
          editorRef.current.innerHTML = newHtml;
        }
      } catch (error) {
        console.error('RichTextEditor sync error:', error);  // ✅ Log without crashing
      } finally {
        // Reset flag immediately after (handles sync triggers)
        isUpdating.current = false;
      }
    }
  }, [value, isFocused]);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleInput = () => {
    if (editorRef.current && !isUpdating.current) {  // ✅ Skip if programmatic update
      const html = editorRef.current.innerHTML;
      onChange?.(html);  // Optional chaining for safety
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');  // ✅ Fallback for older browsers
    document.execCommand('insertHTML', false, text);  // ✅ FIXED: Use insertHTML for reliable plain text insert in contentEditable
    handleInput();
  };

  const isCommandActive = (command) => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;  // ✅ Safety for deprecated API
    }
  };

  return (
    <div className={`rich-text-editor-container ${className || ''}`}>
      {/* Toolbar */}
      <div className="rich-text-toolbar">
        <button
          type="button"  // ✅ Explicit for consistency
          onClick={() => execCommand('bold')}
          className={`toolbar-btn ${isCommandActive('bold') ? 'active' : ''}`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className={`toolbar-btn ${isCommandActive('italic') ? 'active' : ''}`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className={`toolbar-btn ${isCommandActive('underline') ? 'active' : ''}`}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>

        <div className="toolbar-divider" />
        
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className={`toolbar-btn ${isCommandActive('insertUnorderedList') ? 'active' : ''}`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className={`toolbar-btn ${isCommandActive('insertOrderedList') ? 'active' : ''}`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="toolbar-divider" />
        
        <button
          type="button"
          onClick={() => execCommand('removeFormat')}
          className="toolbar-btn"
          title="Clear Formatting"
        >
          <Eraser className="w-4 h-4" />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="rich-text-editor"
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        data-placeholder={placeholder || 'Enter text...'}
        suppressContentEditableWarning
        // ✅ Safety: Ensure initial empty state
        dangerouslySetInnerHTML={value === undefined ? undefined : undefined}  // Avoid initial __html
      />
    </div>
  );
}