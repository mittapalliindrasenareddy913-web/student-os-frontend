import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  ChevronRight,
  CircleCheck,
  Image,
  Plus,
  Search,
  Trash2,
  Folder,
  Pin,
  Star,
  BookOpen,
  FileText,
  Mic,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import PremiumLock from '../components/PremiumLock';

const FOLDERS = ['Notes', 'PDFs', 'Assignments', 'AI Doubts', 'Important Questions'];

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'code-block'],
    ['clean'],
  ],
};

const NoteSkeleton = ({ className }) => (
  <div className={`bg-dark-surface animate-pulse rounded-xl ${className}`} />
);

const SidebarItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
      active
        ? 'bg-primary/15 text-primary'
        : 'text-text-secondary hover:text-text-primary hover:bg-dark-bg'
    }`}
  >
    {icon && (
      <span className={active ? 'text-primary' : 'text-text-secondary/70'}>
        {icon}
      </span>
    )}
    <span className="truncate">{label}</span>
  </button>
);

export default function Notes() {
  const { API, user } = useContext(AuthContext);

  if (!user?.isCollegeConnected) {
    return <PremiumLock moduleName="Notes" />;
  }
  const [searchParams] = useSearchParams();

  const [subjects, setSubjects] = useState(['General']);
  const [notes, setNotes] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedFolder, setSelectedFolder] = useState('All');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeNote, setActiveNote] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState(null);

  // Sync state from query parameters
  useEffect(() => {
    const subjectParam = searchParams.get('subject');
    const folderParam = searchParams.get('folder');
    if (subjectParam) setSelectedSubject(subjectParam);
    if (folderParam) setSelectedFolder(folderParam);
  }, [searchParams]);

  // Sync active note selection from query parameter when notes load
  useEffect(() => {
    const noteId = searchParams.get('noteId');
    if (noteId && notes.length > 0) {
      const foundNote = notes.find((n) => n._id === noteId);
      if (foundNote) {
        setActiveNote({ ...foundNote });
      }
    }
  }, [searchParams, notes]);

  const fetchNotes = async () => {
    try {
      const [notesRes, attendanceRes] = await Promise.all([
        API.get('/notes', { params: { subject: selectedSubject, folder: selectedFolder } }),
        API.get('/attendance'),
      ]);
      setNotes(notesRes.data);
      const subjectNames = attendanceRes.data.map((subj) => subj.name);
      if (subjectNames.length === 0) {
        subjectNames.push('General');
      }
      setSubjects(subjectNames);
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, [selectedSubject, selectedFolder]);

  const selectNote = (note = null) => {
    setActiveNote(
      note
        ? { ...note }
        : {
            title: '',
            content: '',
            subject: selectedSubject === 'All' ? subjects[0] : selectedSubject,
            folder: selectedFolder === 'All' ? 'Notes' : selectedFolder,
            tags: [],
            isPinned: false,
            isFav: false,
            attachments: [],
          }
    );
  };

  const saveNote = async (noteToSave) => {
    setIsSaving(true);
    try {
      const response = noteToSave._id
        ? await API.put(`/notes/${noteToSave._id}`, noteToSave)
        : await API.post('/notes', noteToSave);
      setActiveNote(response.data);
      await fetchNotes();
    } catch (err) {
      console.error('Error saving note:', err);
    }
    setIsSaving(false);
  };

  const updateNoteField = (field, value) => {
    setActiveNote((prev) => {
      const updated = { ...prev, [field]: value };
      if (updated.title.trim() !== '') {
        if (saveTimeout) clearTimeout(saveTimeout);
        setSaveTimeout(setTimeout(() => saveNote(updated), 1500));
      }
      return updated;
    });
  };

  const deleteNote = async (noteId) => {
    if (confirm('Delete this note?')) {
      try {
        await API.delete(`/notes/${noteId}`);
        if (activeNote?._id === noteId) {
          setActiveNote(null);
        }
        await fetchNotes();
      } catch (err) {
        console.error('Error deleting note:', err);
      }
    }
  };

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const simulateUpload = (type) => {
    const dummyUrl = prompt(
      `Simulating ${type} Upload. Enter dummy URL:`,
      `https://example.com/file.${type === 'pdf' ? 'pdf' : type === 'image' ? 'png' : 'mp3'}`
    );
    if (dummyUrl) {
      updateNoteField('attachments', [
        ...(activeNote.attachments || []),
        { url: dummyUrl, type: type, name: `Uploaded ${type}` },
      ]);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] pb-20 md:pb-0 overflow-hidden">
      {/* Subject and Folder Sidebar */}
      <div className={`w-full md:w-64 flex-shrink-0 bg-dark-surface/50 border-r border-dark-border overflow-y-auto custom-scrollbar flex flex-col ${activeNote ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5">
          <h2 className="text-xl font-extrabold mb-4">Library</h2>
          <div className="space-y-1">
            <SidebarItem
              icon={<Folder size={16} />}
              label="All Subjects"
              active={selectedSubject === 'All'}
              onClick={() => setSelectedSubject('All')}
            />
            {subjects.map((subj) => (
              <SidebarItem
                key={subj}
                icon={<BookOpen size={16} />}
                label={subj}
                active={selectedSubject === subj}
                onClick={() => setSelectedSubject(subj)}
              />
            ))}
          </div>
          <hr className="my-5 border-dark-border" />
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-3">Folders</h3>
          <div className="space-y-1">
            <SidebarItem
              label="All Folders"
              active={selectedFolder === 'All'}
              onClick={() => setSelectedFolder('All')}
            />
            {FOLDERS.map((folder) => (
              <SidebarItem
                key={folder}
                label={folder}
                active={selectedFolder === folder}
                onClick={() => setSelectedFolder(folder)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Notes List Panel */}
      <div className={`flex-1 flex flex-col bg-dark-bg min-w-[300px] border-r border-dark-border ${activeNote ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-dark-border flex justify-between items-center bg-dark-surface/30">
          <div>
            <h2 className="font-extrabold text-lg">
              {selectedSubject === 'All' ? 'All Notes' : selectedSubject}
            </h2>
            <p className="text-[11px] text-text-secondary">
              {filteredNotes.length} items • {selectedFolder}
            </p>
          </div>
        </div>
        <div className="p-3 border-b border-dark-border">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-surface border border-dark-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors placeholder:text-text-secondary/50"
              placeholder="Search..."
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((_, index) => (
                <NoteSkeleton key={index} className="h-20" />
              ))}
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="p-6 text-center text-text-secondary text-sm">
              No notes found.
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note._id}
                onClick={() => selectNote(note)}
                className={`p-3 rounded-xl border cursor-pointer transition-all hover:bg-dark-surface ${
                  activeNote?._id === note._id
                    ? 'bg-dark-surface border-primary/50'
                    : 'bg-dark-surface/40 border-dark-border hover:border-dark-border/80'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h4 className="font-bold text-sm truncate">
                    {note.title || 'Untitled Note'}
                  </h4>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {note.isPinned && (
                      <Pin size={12} className="text-primary fill-primary" />
                    )}
                    {note.isFav && (
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed h-8">
                  {note.content.replace(/<[^>]*>?/gm, '') || 'No content...'}
                </p>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-dark-border/50">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-dark-border bg-dark-bg text-text-secondary truncate max-w-[80px]">
                    {note.folder}
                  </span>
                  <span className="text-[9px] text-text-secondary">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor Panel */}
      {activeNote ? (
        <div className="flex-[2] flex flex-col bg-dark-bg h-full overflow-hidden relative">
          <div className="h-14 border-b border-dark-border flex items-center justify-between px-4 bg-dark-surface/50">
            <div className="flex items-center gap-2">
              <button
                onClick={() => selectNote(null)}
                className="lg:hidden p-1 mr-1 text-text-secondary"
              >
                <ChevronRight size={20} className="rotate-180" />
              </button>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-dark-bg border border-dark-border rounded-md text-[11px] font-semibold text-text-secondary">
                <span>{activeNote.subject}</span>
                <ChevronRight size={10} />
                <span>{activeNote.folder}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-secondary font-semibold bg-dark-bg border border-dark-border px-2.5 py-1 rounded-md">
                Read Only
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            <div className="p-6 md:p-10 max-w-4xl mx-auto w-full flex-1 flex flex-col">
              <input
                readOnly
                value={activeNote.title}
                placeholder="Note Title..."
                className="w-full bg-transparent text-3xl font-extrabold outline-none placeholder:text-text-secondary/30 mb-6"
              />
              <div className="flex gap-2 mb-4 pb-4 border-b border-dark-border/50 overflow-x-auto custom-scrollbar">
                {activeNote.attachments?.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
                  >
                    {attachment.type === 'pdf' ? (
                      <FileText size={14} />
                    ) : attachment.type === 'image' ? (
                      <Image size={14} />
                    ) : (
                      <Mic size={14} />
                    )}
                    {attachment.name}
                  </a>
                ))}
              </div>
              <div className="flex-1 quill-dark-theme -mx-3">
                <ReactQuill
                  readOnly={true}
                  theme={null}
                  modules={{ toolbar: false }}
                  value={activeNote.content}
                  placeholder="No content in note..."
                  className="h-full"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-[2] flex-col items-center justify-center text-center p-10">
          <div className="w-20 h-20 bg-dark-surface rounded-full flex items-center justify-center mb-4">
            <FileText size={32} className="text-text-secondary/50" />
          </div>
          <h3 className="text-xl font-extrabold text-text-primary">No Note Selected</h3>
          <p className="text-sm text-text-secondary mt-2 max-w-sm">
            Select a note from the list to view its contents.
          </p>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .quill-dark-theme .ql-toolbar {
              border: none !important;
              border-bottom: 1px solid rgba(255,255,255,0.1) !important;
              padding: 8px 12px !important;
              background: rgba(255,255,255,0.02) !important;
            }
            .quill-dark-theme .ql-container {
              border: none !important;
              font-family: inherit !important;
              font-size: 15px !important;
            }
            .quill-dark-theme .ql-editor {
              padding: 16px 12px !important;
              min-height: 400px;
              line-height: 1.6;
            }
            .quill-dark-theme .ql-editor.ql-blank::before {
              color: rgba(255,255,255,0.2) !important;
              font-style: normal !important;
            }
            .quill-dark-theme .ql-stroke {
              stroke: #9ca3af !important;
            }
            .quill-dark-theme .ql-fill {
              fill: #9ca3af !important;
            }
            .quill-dark-theme .ql-picker {
              color: #9ca3af !important;
            }
            .quill-dark-theme .ql-snow .ql-picker-options {
              background: #1e212b !important;
              border-color: rgba(255,255,255,0.1) !important;
            }
            .quill-dark-theme .ql-snow .ql-tooltip {
              background: #1e212b !important;
              border: 1px solid rgba(255,255,255,0.1) !important;
              color: #fff !important;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important;
            }
            .quill-dark-theme .ql-snow .ql-tooltip input[type=text] {
              background: rgba(255,255,255,0.05) !important;
              border: 1px solid rgba(255,255,255,0.1) !important;
              color: #fff !important;
            }
          `,
        }}
      />
    </div>
  );
}
