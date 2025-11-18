import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, List, Clock, CheckSquare, Trash2, Plus, Check, ChevronUp, ChevronDown } from "lucide-react";
import { RichTextEditor } from './RichTextEditor';
import './RichTextEditor.css';

// GeneralNotesEditor component
function GeneralNotesEditor({ note, isEditMode, onUpdate }) {
 if (!note) {
    return <div className="text-white">No note data available</div>;
  }


  const [items, setItems] = useState(note.items || []);
  const [summary, setSummary] = useState(note.summary || '');
  const [showSummary, setShowSummary] = useState(!!note.summary);
  const [noteName, setNoteName] = useState(note.name);
  const [isEditingName, setIsEditingName] = useState(false);

  const updateItems = (newItems) => {
    setItems(newItems);
    onUpdate({ items: newItems });
  };

  const addNote = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      text: '',
      sequence: items.length + 1
    };
    updateItems([...items, newItem]);
  };

  const updateNoteText = (itemId, text) => {
    updateItems(items.map(item => 
      item.id === itemId ? { ...item, text } : item
    ));
  };

  const deleteNoteItem = (itemId) => {
    const newItems = items.filter(item => item.id !== itemId);
    // Resequence
    const resequenced = newItems.map((item, index) => ({
      ...item,
      sequence: index + 1
    }));
    updateItems(resequenced);
  };

  const moveItem = (fromIndex, toIndex) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    // Resequence
    const resequenced = newItems.map((item, index) => ({
      ...item,
      sequence: index + 1
    }));
    updateItems(resequenced);
  };

  const updateSummaryText = (text) => {
    setSummary(text);
    onUpdate({ summary: text });
  };

  const toggleSummary = () => {
    if (showSummary) {
      setSummary('');
      onUpdate({ summary: null });
    }
    setShowSummary(!showSummary);
  };

  const updateNoteName = () => {
    onUpdate({ name: noteName });
    setIsEditingName(false);
  };

  return (
    <div className="space-y-4">
      {/* Note Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          {isEditingName && isEditMode ? (
            <div className="flex items-center gap-2">
              <Input
                value={noteName}
                onChange={(e) => setNoteName(e.target.value)}
                onBlur={updateNoteName}
                onKeyPress={(e) => e.key === 'Enter' && updateNoteName()}
                className="bg-white/10 border-white/20 text-white"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={updateNoteName}
                className="text-green-400"
              >
                <Check className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <h3 
              className={`text-xl font-semibold text-white ${isEditMode ? 'cursor-pointer hover:text-gray-300' : ''}`}
              onClick={() => isEditMode && setIsEditingName(true)}
            >
              {noteName}
            </h3>
          )}
        </div>
        {isEditMode && !showSummary && (
          <Button
            size="sm"
            variant="outline"
            onClick={toggleSummary}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Summary
          </Button>
        )}
      </div>

      {/* Summary Box */}
      {showSummary && (
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-300">Summary</h4>
            {isEditMode && (
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleSummary}
                className="text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
          {isEditMode ? (
  <RichTextEditor
    value={summary}
    onChange={(value) => updateSummaryText(value)}
    placeholder="Enter summary..."
    className="w-full"
  />
          ) : (
            <div 
              className="text-white prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: summary || '<span class="text-gray-500">No summary</span>' }}
            />
          )}
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 group"
          >
            <div className="flex items-start gap-3">
              <span className="text-gray-400 text-sm font-mono mt-1">
                {item.sequence}.
              </span>
              {isEditMode ? (
                <div className="flex-1 flex items-start gap-2">
                  <RichTextEditor
                    value={item.text}
                    onChange={(value) => updateNoteText(item.id, value)}
                    placeholder="Enter note..."
                    className="flex-1"
                  />
                                    <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNoteItem(item.id)}
                      className="text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {index > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveItem(index, index - 1)}
                        className="text-gray-400 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                    )}
                    {index < items.length - 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveItem(index, index + 1)}
                        className="text-gray-400 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ) :(
                <div 
                  className="text-white flex-1 prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: item.text || '<span class="text-gray-500">Empty note</span>' }}
                />
              )}
            </div>
          </div>
        ))}
        
        {isEditMode && (
          <Button
            onClick={addNote}
            variant="outline"
            className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        )}
      </div>
    </div>
  );
}

// SequentialNotesEditor component
function SequentialNotesEditor({ note, isEditMode, onUpdate }) {
  const [items, setItems] = useState(note.items || []);
  const [noteName, setNoteName] = useState(note.name);
  const [isEditingName, setIsEditingName] = useState(false);

  const updateItems = (newItems) => {
    setItems(newItems);
    onUpdate({ items: newItems });
  };

  const addMainNote = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      text: '',
      sequence: items.length + 1,
      subNotes: []
    };
    updateItems([...items, newItem]);
  };

  const addSubNote = (parentId, level = 1) => {
    const addSubToItem = (items) => {
      return items.map(item => {
        if (item.id === parentId) {
          const newSubNote = {
            id: `sub-${Date.now()}`,
            text: '',
            sequence: (item.subNotes?.length || 0) + 1,
            subNotes: level < 3 ? [] : undefined
          };
          return {
            ...item,
            subNotes: [...(item.subNotes || []), newSubNote]
          };
        }
        if (item.subNotes) {
          return {
            ...item,
            subNotes: addSubToItem(item.subNotes)
          };
        }
        return item;
      });
    };
    
    updateItems(addSubToItem(items));
  };

  const updateNoteText = (itemId, text) => {
    const updateInItems = (items) => {
      return items.map(item => {
        if (item.id === itemId) {
          return { ...item, text };
        }
        if (item.subNotes) {
          return {
            ...item,
            subNotes: updateInItems(item.subNotes)
          };
        }
        return item;
      });
    };
    
    updateItems(updateInItems(items));
  };

  const deleteNote = (itemId) => {
    const deleteFromItems = (items) => {
      return items
        .filter(item => item.id !== itemId)
        .map((item, index) => ({
          ...item,
          sequence: index + 1,
          subNotes: item.subNotes ? deleteFromItems(item.subNotes) : item.subNotes
        }));
    };
    
    updateItems(deleteFromItems(items));
  };

  const moveItem = (itemId, direction, parentItems = null) => {
    const targetItems = parentItems || items;
    const index = targetItems.findIndex(item => item.id === itemId);
    
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= targetItems.length) return;
    
    const newItems = [...targetItems];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    
    // Resequence
    const resequenced = newItems.map((item, idx) => ({
      ...item,
      sequence: idx + 1
    }));
    
    if (parentItems) {
      // Update nested structure
      const updateParent = (items) => {
        return items.map(item => {
          if (item.subNotes && item.subNotes.includes(targetItems[0])) {
            return { ...item, subNotes: resequenced };
          }
          if (item.subNotes) {
            return { ...item, subNotes: updateParent(item.subNotes) };
          }
          return item;
        });
      };
      updateItems(updateParent(items));
    } else {
      updateItems(resequenced);
    }
  };

  const renderNote = (item, level = 0, parentItems = null, index = 0) => {
    const canAddSubNote = level < 2; // Max 3 levels (0, 1, 2)
    
    return (
      <div key={item.id} className={`${level > 0 ? `ml-${level * 8}` : ''}`}>
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 group mb-2">
          <div className="flex items-start gap-3">
            <span className="text-gray-400 text-sm font-mono mt-1">
              {item.sequence}.
            </span>
            {isEditMode ? (
              <div className="flex-1 flex items-start gap-2">
                            <RichTextEditor
                  value={item.text}
                  onChange={(value) => updateNoteText(item.id, value)}
                  placeholder="Enter note..."
                  className="flex-1"
                />
                <div className="flex flex-col gap-1">
                  {canAddSubNote && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => addSubNote(item.id, level + 1)}
                      className="text-blue-400 hover:bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteNote(item.id)}
                    className="text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  {index > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveItem(item.id, 'up', parentItems)}
                      className="text-gray-400 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                  )}
                  {parentItems && index < parentItems.length - 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveItem(item.id, 'down', parentItems)}
                      className="text-gray-400 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ) :  (
              <div 
                className="text-white flex-1 prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: item.text || '<span class="text-gray-500">Empty note</span>' }}
              />
            )}
          </div>
        </div>
        
        {/* Render sub-notes */}
        {item.subNotes && item.subNotes.length > 0 && (
          <div className={`ml-8 space-y-2`}>
            {item.subNotes.map((subNote, subIndex) => 
              renderNote(subNote, level + 1, item.subNotes, subIndex)
            )}
          </div>
        )}
      </div>
    );
  };

  const updateNoteName = () => {
    onUpdate({ name: noteName });
    setIsEditingName(false);
  };

  return (
    <div className="space-y-4">
      {/* Note Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <List className="w-5 h-5 text-green-400" />
          {isEditingName && isEditMode ? (
            <div className="flex items-center gap-2">
              <Input
                value={noteName}
                onChange={(e) => setNoteName(e.target.value)}
                onBlur={updateNoteName}
                onKeyPress={(e) => e.key === 'Enter' && updateNoteName()}
                className="bg-white/10 border-white/20 text-white"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={updateNoteName}
                className="text-green-400"
              >
                <Check className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <h3 
              className={`text-xl font-semibold text-white ${isEditMode ? 'cursor-pointer hover:text-gray-300' : ''}`}
              onClick={() => isEditMode && setIsEditingName(true)}
            >
              {noteName}
            </h3>
          )}
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-2">
        {items.map((item, index) => renderNote(item, 0, items, index))}
        
        {isEditMode && (
          <Button
            onClick={addMainNote}
            variant="outline"
            className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        )}
      </div>
    </div>
  );
}

// TimeLogsEditor component
function TimeLogsEditor({ note, isEditMode, onUpdate }) {
  const [items, setItems] = useState(note.items || []);
  const [noteName, setNoteName] = useState(note.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY HH:mm');

  const updateItems = (newItems) => {
    setItems(newItems);
    onUpdate({ items: newItems });
  };

  const addTimeLog = () => {
    const newItem = {
      id: `log-${Date.now()}`,
      datetime: new Date().toISOString(),
      text: '',
      sequence: items.length + 1
    };
    updateItems([...items, newItem]);
  };

  const updateLogText = (itemId, text) => {
    updateItems(items.map(item => 
      item.id === itemId ? { ...item, text } : item
    ));
  };

  const updateLogDatetime = (itemId, datetime) => {
    updateItems(items.map(item => 
      item.id === itemId ? { ...item, datetime } : item
    ));
  };

  const deleteLog = (itemId) => {
    const newItems = items.filter(item => item.id !== itemId);
    // Resequence
    const resequenced = newItems.map((item, index) => ({
      ...item,
      sequence: index + 1
    }));
    updateItems(resequenced);
  };

  const formatDate = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleString();
  };

  const updateNoteName = () => {
    onUpdate({ name: noteName });
    setIsEditingName(false);
  };

  return (
    <div className="space-y-4">
      {/* Note Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-400" />
          {isEditingName && isEditMode ? (
            <div className="flex items-center gap-2">
              <Input
                value={noteName}
                onChange={(e) => setNoteName(e.target.value)}
                onBlur={updateNoteName}
                onKeyPress={(e) => e.key === 'Enter' && updateNoteName()}
                className="bg-white/10 border-white/20 text-white"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={updateNoteName}
                className="text-green-400"
              >
                <Check className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <h3 
              className={`text-xl font-semibold text-white ${isEditMode ? 'cursor-pointer hover:text-gray-300' : ''}`}
              onClick={() => isEditMode && setIsEditingName(true)}
            >
              {noteName}
            </h3>
          )}
        </div>
      </div>

      {/* Time Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20">
              <th className="text-left text-gray-400 font-medium pb-2 px-3">Date/Time</th>
              <th className="text-left text-gray-400 font-medium pb-2 px-3">Log Entry</th>
              {isEditMode && <th className="w-10"></th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-white/10 group">
                <td className="py-3 px-3 align-top">
                  {isEditMode ? (
                    <Input
                      type="datetime-local"
                      value={new Date(item.datetime).toISOString().slice(0, 16)}
                      onChange={(e) => updateLogDatetime(item.id, new Date(
                                                e.target.value).toISOString())}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  ) : (
                    <span className="text-gray-300 text-sm">{formatDate(item.datetime)}</span>
                  )}
                </td>
                <td className="py-3 px-3 align-top">
                  {isEditMode ? (
  <RichTextEditor
    value={item.text}
    onChange={(value) => updateLogText(item.id, value)}  // ✅ CORRECT
    placeholder="Enter log entry..."
    className="flex-1"
  />
                ) : (
                  <div 
                    className="text-white prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: item.text || '<span class="text-gray-500">Empty log</span>' }}
                  />
                )}
                </td>
                {isEditMode && (
                  <td className="py-3 px-3 align-top">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteLog(item.id)}
                      className="text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {isEditMode && (
        <Button
          onClick={addTimeLog}
          variant="outline"
          className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Time Log
        </Button>
      )}
    </div>
  );
}

// ChecklistEditor component
function ChecklistEditor({ note, isEditMode, onUpdate }) {
  const [items, setItems] = useState(note.items || []);
  const [noteName, setNoteName] = useState(note.name);
  const [isEditingName, setIsEditingName] = useState(false);

  const updateItems = (newItems) => {
    setItems(newItems);
    onUpdate({ items: newItems });
  };

  const addChecklistItem = () => {
    const newItem = {
      id: `check-${Date.now()}`,
      text: '',
      checked: false,
      sequence: items.length + 1
    };
    updateItems([...items, newItem]);
  };

  const updateItemText = (itemId, text) => {
    updateItems(items.map(item => 
      item.id === itemId ? { ...item, text } : item
    ));
  };

  const toggleItemCheck = (itemId) => {
    updateItems(items.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    ));
  };

  const deleteItem = (itemId) => {
    const newItems = items.filter(item => item.id !== itemId);
    // Resequence
    const resequenced = newItems.map((item, index) => ({
      ...item,
      sequence: index + 1
    }));
    updateItems(resequenced);
  };

  const moveItem = (fromIndex, toIndex) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    // Resequence
    const resequenced = newItems.map((item, index) => ({
      ...item,
      sequence: index + 1
    }));
    updateItems(resequenced);
  };

  const updateNoteName = () => {
    onUpdate({ name: noteName });
    setIsEditingName(false);
  };

  console.log(items,'items')
  const completedCount = items.filter(item => item.checked).length;
  const completionPercentage = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Note Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-purple-400" />
          {isEditingName && isEditMode ? (
            <div className="flex items-center gap-2">
              <Input
                value={noteName}
                onChange={(e) => setNoteName(e.target.value)}
                onBlur={updateNoteName}
                onKeyPress={(e) => e.key === 'Enter' && updateNoteName()}
                className="bg-white/10 border-white/20 text-white"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={updateNoteName}
                className="text-green-400"
              >
                <Check className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <h3 
              className={`text-xl font-semibold text-white ${isEditMode ? 'cursor-pointer hover:text-gray-300' : ''}`}
              onClick={() => isEditMode && setIsEditingName(true)}
            >
              {noteName}
            </h3>
          )}
        </div>
        
        {/* Progress Indicator */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            {completedCount} of {items.length} completed
          </span>
          <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 group transition-all ${
              item.checked ? 'opacity-75' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={item.checked}
                onCheckedChange={() => toggleItemCheck(item.id)}
                className="border-white/30 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
              />
              
              {isEditMode ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={item.text}
                    onChange={(e) => updateItemText(item.id, e.target.value)}
                    placeholder="Enter task..."
                    className={`bg-white/10 border-white/20 text-white flex-1 ${
                      item.checked ? 'line-through opacity-75' : ''
                    }`}
                  />
                  <div className="flex items-center gap-1">
                    {index > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveItem(index, index - 1)}
                        className="text-gray-400 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                    )}
                    {index < items.length - 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveItem(index, index + 1)}
                        className="text-gray-400 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteItem(item.id)}
                      className="text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <p className={`text-white flex-1 ${item.checked ? 'line-through opacity-75' : ''}`}>
                  {item.text || <span className="text-gray-500">Empty task</span>}
                </p>
              )}
            </div>
          </div>
        ))}
        
        {isEditMode && (
          <Button
            onClick={addChecklistItem}
            variant="outline"
            className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>
    </div>
  );
}


export { GeneralNotesEditor, SequentialNotesEditor, TimeLogsEditor, ChecklistEditor };