// NotesSection.jsx
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  FileText,
  Plus,
  Trash2,
  X,
  List,
  Clock,
  CheckSquare
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ChecklistEditor, 
  GeneralNotesEditor, 
  SequentialNotesEditor, 
  TimeLogsEditor 
} from './GeneralNotesEditor';

export default function NotesSection({ data, isEditMode, onDataChange }) {
  const initializeNotes = (notesData) => {
    if (!notesData || !Array.isArray(notesData)) return [];
    return notesData.map((note, index) => ({
      ...note,
      id: note.id || `note-${Date.now()}-${index}`,
      items: (note.items || []).map((item, itemIndex) => ({
        ...item,
        id: item.id || `item-${Date.now()}-${index}-${itemIndex}`,
        subNotes: (item.subNotes || []).map((subNote, subIndex) => ({
          ...subNote,
          id: subNote.id || `sub-${Date.now()}-${index}-${itemIndex}-${subIndex}`
        }))
      }))
    }));
  };

  const [notes, setNotes] = useState(() => initializeNotes(data?.notes));
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newNoteType, setNewNoteType] = useState(null);

  console.log("NotesSection render - notes:", notes);

  // Update parent data when notes change
  useEffect(() => {
    if (isEditMode) {
      console.log("Updating parent with notes:", notes);
      onDataChange({
        ...data,
        notes: notes
      });
    }
  }, [notes]);

  const createNote = (type) => {
    console.log("Creating note of type:", type);
    
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    
    const newNote = {
      id: `note-${timestamp}-${randomSuffix}`,
      type,
      name: getDefaultNoteName(type),
      summary: type === 'general' ? '' : undefined,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log("New note created:", newNote);
    
    // Update notes state
    setNotes(prevNotes => {
      const updatedNotes = [...prevNotes, newNote];
      console.log("Updated notes array:", updatedNotes);
      return updatedNotes;
    });
    
    // Set as selected note
    setSelectedNote(newNote);
    setShowCreateMenu(false);
    setIsCreatingNote(false);
    setNewNoteType(null);
    
    console.log("Note creation completed, selected note set");
  };

  const getDefaultNoteName = (type) => {
    const defaults = {
      general: 'General Notes',
      sequential: 'Sequential Notes',
      time_logs: 'Time Logs',
      checklist: 'Checklist'
    };
    return defaults[type] || 'New Note';
  };

  const updateNote = (noteId, updates) => {
    console.log("Updating note:", noteId, updates);
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === noteId ? { ...note, ...updates, updatedAt: new Date().toISOString() } : note
      )
    );
  };

  const deleteNote = (noteId) => {
    console.log("Deleting note:", noteId);
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
    }
  };

  const getNoteIcon = (type) => {
    switch (type) {
      case 'general': return <FileText className="w-4 h-4" />;
      case 'sequential': return <List className="w-4 h-4" />;
      case 'time_logs': return <Clock className="w-4 h-4" />;
      case 'checklist': return <CheckSquare className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Notes List */}
      <div className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Not88es</h3>
           {isEditMode && (
    <Dialog open={showCreateMenu} onOpenChange={setShowCreateMenu}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Note
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[400px] bg-gray-900 border border-white/20 rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-white">Create a new note</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => {
              createNote("general");
              setShowCreateMenu(false);
            }}
            className="p-3 flex flex-col items-center gap-2 text-center text-white bg-white/5 hover:bg-white/15 rounded-lg border border-white/10 transition-all"
          >
            <FileText className="w-6 h-6 text-blue-400" />
            <span className="text-sm font-medium">General Notes</span>
          </button>

          <button
            onClick={() => {
              createNote("sequential");
              setShowCreateMenu(false);
            }}
            className="p-3 flex flex-col items-center gap-2 text-center text-white bg-white/5 hover:bg-white/15 rounded-lg border border-white/10 transition-all"
          >
            <List className="w-6 h-6 text-green-400" />
            <span className="text-sm font-medium">Sequential</span>
          </button>

          <button
            onClick={() => {
              createNote("time_logs");
              setShowCreateMenu(false);
            }}
            className="p-3 flex flex-col items-center gap-2 text-center text-white bg-white/5 hover:bg-white/15 rounded-lg border border-white/10 transition-all"
          >
            <Clock className="w-6 h-6 text-yellow-400" />
            <span className="text-sm font-medium">Time Logs</span>
          </button>

          <button
            onClick={() => {
              createNote("checklist");
              setShowCreateMenu(false);
            }}
            className="p-3 flex flex-col items-center gap-2 text-center text-white bg-white/5 hover:bg-white/15 rounded-lg border border-white/10 transition-all"
          >
            <CheckSquare className="w-6 h-6 text-purple-400" />
            <span className="text-sm font-medium">Checklist</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )}
</div>
        {notes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No notes created yet</p>
            {isEditMode && (
              <p className="text-gray-500 text-sm mt-2">Click "Create Note" to get started</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  console.log("Note clicked:", note);
                  setSelectedNote(note);
                }}
                className={`bg-white/5 backdrop-blur-sm rounded-lg p-4 border cursor-pointer transition-all ${
                  selectedNote?.id === note.id 
                    ? 'border-purple-400 bg-white/10' 
                    : 'border-white/10 hover:border-white/30 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getNoteIcon(note.type)}
                    <span className="text-xs text-gray-400 capitalize">
                      {note.type.replace('_', ' ')}
                    </span>
                  </div>
                  {isEditMode && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      className="text-red-400 hover:bg-red-500/20 -mr-2 -mt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <h4 className="text-white font-medium mb-1">{note.name}</h4>
                <p className="text-gray-400 text-xs">
                  {note.items.length} {note.items.length === 1 ? 'item' : 'items'}
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Updated {new Date(note.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Note Detail */}
      {selectedNote && (
        <div className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-6">
          {selectedNote.type === 'general' && (
            <GeneralNotesEditor
              note={selectedNote}
              isEditMode={isEditMode}
              onUpdate={(updates) => updateNote(selectedNote.id, updates)}
            />
          )}
          {selectedNote.type === 'sequential' && (
            <SequentialNotesEditor
              note={selectedNote}
              isEditMode={isEditMode}
              onUpdate={(updates) => updateNote(selectedNote.id, updates)}
            />
          )}
          {selectedNote.type === 'time_logs' && (
            <TimeLogsEditor
              note={selectedNote}
              isEditMode={isEditMode}
              onUpdate={(updates) => updateNote(selectedNote.id, updates)}
            />
          )}
          {selectedNote.type === 'checklist' && (
            <ChecklistEditor
              note={selectedNote}
              isEditMode={isEditMode}
              onUpdate={(updates) => updateNote(selectedNote.id, updates)}
            />
          )}
        </div>
      )}
    </div>
  );
}