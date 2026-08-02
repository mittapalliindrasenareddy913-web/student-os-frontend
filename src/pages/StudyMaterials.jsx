import React, { useState, useEffect, useContext, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ChevronRight,
  Eye,
  Plus,
  Search,
  Trash2,
  Upload,
  BookOpen,
  FileText,
  Video,
  Link,
  ExternalLink,
  X,
  FolderInput,
  Edit
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import PremiumLock from '../components/PremiumLock';
import { cacheMaterialFile, getCachedMaterialFile } from '../utils/offlineDb';

const SUBJECT_COLORS = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-orange-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-indigo-500',
  'bg-teal-500',
];

const SUBJECT_ICONS = ['📚', '⚛️', '⚗️', '💻', '📝', '🔢', '🌍', '🎨', '🔬', '📐'];

const getSubjectStyles = (subject) => {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SUBJECT_COLORS.length;
  return { color: SUBJECT_COLORS[index], icon: SUBJECT_ICONS[index] };
};

const MATERIAL_TYPES = {
  note: {
    label: 'Note',
    icon: '📝',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  pdf: {
    label: 'PDF',
    icon: '📄',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  book: {
    label: 'Book',
    icon: '📖',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  video: {
    label: 'Video',
    icon: '🎬',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  other: {
    label: 'File',
    icon: '📎',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  },
};

const FILTER_TABS = [
  { id: 'all', label: 'All', icon: <BookOpen size={13} /> },
  { id: 'note', label: 'Notes', icon: <FileText size={13} /> },
  { id: 'pdf', label: 'PDFs', icon: <FileText size={13} /> },
  { id: 'book', label: 'Books', icon: <BookOpen size={13} /> },
  { id: 'video', label: 'Videos', icon: <Video size={13} /> },
];

export default function StudyMaterials() {
  const { API, user } = useContext(AuthContext);

  if (!user?.isCollegeConnected) {
    return <PremiumLock moduleName="Study Materials" />;
  }
  const [folders, setFolders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const fetchFolders = async () => {
    setLoading(true);
    if (!navigator.onLine) {
      try {
        const cached = JSON.parse(localStorage.getItem('study_folders') || '[]');
        setFolders(cached);
      } catch (e) {
        setFolders([]);
      }
      setLoading(false);
      return;
    }
    try {
      const { data } = await API.get('/folders');
      setFolders(data);
      localStorage.setItem('study_folders', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to load folders:', err);
      try {
        const cached = JSON.parse(localStorage.getItem('study_folders') || '[]');
        setFolders(cached);
      } catch (e) {
        setFolders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      fetchFolders();
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCreateFolder = async (name) => {
    try {
      await API.post('/folders', { name });
      toast.success('Folder created! 📁');
      fetchFolders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create folder');
    }
  };

  const handleRenameFolder = async (id, currentName) => {
    const newName = window.prompt("Rename folder:", currentName);
    if (!newName || !newName.trim() || newName.trim() === currentName) return;
    try {
      await API.put(`/folders/${id}`, { name: newName });
      toast.success('Folder renamed! 📁');
      fetchFolders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to rename folder');
    }
  };

  const handleDeleteFolder = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the folder "${name}"? All files inside it will be permanently deleted.`)) return;
    try {
      await API.delete(`/folders/${id}`);
      toast.success('Folder deleted.');
      fetchFolders();
    } catch (err) {
      toast.error('Failed to delete folder.');
    }
  };

  if (selectedSubject) {
    return (
      <SubjectDetails
        subject={selectedSubject}
        initialFilter={filter}
        onBack={() => {
          setSelectedSubject(null);
          fetchFolders();
        }}
        API={API}
        folderNames={folders.map((f) => f.name)}
      />
    );
  }

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 pb-28 md:pb-8 max-w-4xl mx-auto">
      {/* Offline Mode Banner */}
      {isOffline && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3 mb-5 flex items-center justify-between text-amber-400 animate-pulse">
          <div className="flex items-center gap-2 text-xs font-extrabold">
            <span>⚠️ Offline Mode Active</span>
            <span className="font-normal text-[11px] text-text-secondary hidden sm:inline">
              · Viewing cached folders & reading cached files. Uploads are disabled.
            </span>
          </div>
          <span className="text-[10px] bg-amber-500/20 px-2.5 py-0.5 rounded-full font-bold">
            Local Only
          </span>
        </div>
      )}

      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">Study Materials</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {folders.length} subject folders
          </p>
        </div>
        <button
          onClick={() => setShowSearch((prev) => !prev)}
          className="w-10 h-10 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center hover:bg-dark-border transition-colors"
        >
          <Search size={18} />
        </button>
      </div>

      {showSearch && (
        <div className="mb-4 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects..."
            className="w-full bg-dark-surface border border-dark-border rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 mb-5">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              filter === tab.id
                ? 'bg-primary text-white border-transparent shadow-lg shadow-primary/30'
                : 'bg-dark-surface text-text-secondary border-dark-border hover:border-primary/40 hover:text-primary'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/20 p-5 flex items-center gap-4 relative overflow-hidden mb-5">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full blur-3xl" />
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30 flex-shrink-0 z-10">
          <BookOpen className="text-white" size={24} />
        </div>
        <div className="z-10">
          <h2 className="text-sm font-bold text-text-primary">
            {filter === 'all'
              ? 'All Study Materials'
              : `${FILTER_TABS.find((tab) => tab.id === filter)?.label} Only`}
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Tap any subject to view or upload materials
          </p>
        </div>
      </div>

      <div className="glass-card p-5 mb-5">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Subject Folders
          </h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 bg-dark-surface animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredFolders.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-3 text-center">
            <div className="text-4xl">📁</div>
            <p className="font-bold text-sm">No folders found</p>
            <p className="text-text-secondary text-xs max-w-[220px]">
              Please coordinate with your Faculty or HOD to assign subject folders.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFolders.map((folder) => {
              const { color, icon } = getSubjectStyles(folder.name);
              return (
                <div
                  key={folder._id}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-dark-surface/40 border border-transparent hover:border-dark-border transition-all group"
                >
                  <button
                    onClick={() => setSelectedSubject(folder.name)}
                    className="flex-1 flex items-center gap-3 text-left outline-none cursor-pointer min-w-0"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${color} group-hover:scale-105 transition-transform flex-shrink-0`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-text-primary truncate">{folder.name}</h3>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        {folder.pdfCount} PDF{folder.pdfCount === 1 ? '' : 's'}
                      </p>
                    </div>
                  </button>

                  <ChevronRight
                    size={16}
                    onClick={() => setSelectedSubject(folder.name)}
                    className="text-text-secondary group-hover:text-primary transition-colors cursor-pointer shrink-0"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SubjectDetails({ subject, initialFilter, onBack, API, folderNames }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter === 'all' ? 'all' : initialFilter);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState(null);

  const { color, icon } = getSubjectStyles(subject);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const params = { subject };
      if (filter !== 'all') {
        params.type = filter;
      }
      const { data } = await API.get('/study', { params });
      setMaterials(data.materials || []);
    } catch (err) {
      console.error('Failed to load materials:', err);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [subject, filter]);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this material?')) {
      try {
        await API.delete(`/study/${id}`);
        toast.success('Deleted!');
        fetchMaterials();
      } catch (err) {
        toast.error('Delete failed');
      }
    }
  };

  const handleMove = async (material) => {
    const targets = (folderNames || []).filter((name) => name !== subject);
    if (targets.length === 0) {
      toast.error('No other folders to move to.');
      return;
    }

    const choice = window.prompt(
      `Move PDF "${material.title}" to another folder.\nAvailable folders: ${targets.join(', ')}\n\nEnter folder name:`
    );

    if (!choice || !choice.trim()) return;
    const targetFolder = choice.trim();
    if (!targets.some((t) => t.toLowerCase() === targetFolder.toLowerCase())) {
      toast.error(`Invalid folder name. Choose one of: ${targets.join(', ')}`);
      return;
    }

    const targetSubject = targets.find((t) => t.toLowerCase() === targetFolder.toLowerCase());

    try {
      await API.post('/folders/move', { materialId: material._id, targetSubject });
      toast.success('Moved successfully! 🚀');
      fetchMaterials();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to move file');
    }
  };

  const filteredMaterials = materials;

  return (
    <div className="p-4 md:p-8 pb-28 md:pb-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center hover:bg-dark-border transition-colors flex-shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${color} flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-extrabold truncate">{subject}</h1>
          <p className="text-text-secondary text-xs">
            {materials.length} material{materials.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 mb-5">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              filter === tab.id
                ? 'bg-primary text-white border-transparent'
                : 'bg-dark-surface text-text-secondary border-dark-border hover:border-primary/40'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-dark-surface animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="glass-card p-10 flex flex-col items-center gap-3 text-center">
          <div className="text-5xl">
            {filter === 'all' ? '📭' : MATERIAL_TYPES[filter]?.icon || '📭'}
          </div>
          <p className="font-bold">
            No {filter === 'all' ? 'materials' : FILTER_TABS.find((tab) => tab.id === filter)?.label?.toLowerCase()} yet
          </p>
          <p className="text-text-secondary text-xs">
            Please wait for your Faculty to upload study materials.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMaterials.map((material) => (
            <MaterialCard
              key={material._id}
              material={material}
              onDelete={() => handleDelete(material._id)}
              onView={() => setViewingMaterial(material)}
              onMove={() => handleMove(material)}
              API={API}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddMaterialModal
          subject={subject}
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            fetchMaterials();
          }}
          API={API}
        />
      )}

      {viewingMaterial && (
        <ViewMaterialModal
          material={viewingMaterial}
          onClose={() => setViewingMaterial(null)}
          API={API}
        />
      )}
    </div>
  );
}

function MaterialCard({ material, onDelete, onView, onMove }) {
  const meta = MATERIAL_TYPES[material.type] || MATERIAL_TYPES.other;
  return (
    <div className="glass-card p-4 flex items-center gap-3 group hover:border-dark-border/80 transition-all">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl border ${meta.color} flex-shrink-0`}>
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onView}>
        <h3 className="font-bold text-sm truncate">{material.title}</h3>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${meta.color}`}>
            {meta.label}
          </span>
          {material.fileName && (
            <span className="text-[10px] text-text-secondary truncate max-w-[120px]">
              {material.fileName}
            </span>
          )}
          {material.fileUrl && (
            <span className="text-[10px] text-text-secondary">🔗 Link</span>
          )}
          {material.content && !material.fileUrl && !material.fileName && (
            <span className="text-[10px] text-text-secondary truncate max-w-[140px]">
              {material.content.slice(0, 60)}...
            </span>
          )}
        </div>
        <p className="text-[10px] text-text-secondary mt-0.5">
          {new Date(material.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onView}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
        >
          <Eye size={15} />
        </button>
      </div>
    </div>
  );
}

function AddMaterialModal({ subject, onClose, onSaved, API }) {
  const [form, setForm] = useState({
    title: '',
    type: 'note',
    content: '',
    fileUrl: '',
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef();

  // Upload and cancellation states
  const abortControllerRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFailed, setUploadFailed] = useState(false);

  // Auto-abort pending upload on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleFormChange = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File too large (max 5MB)');
        return;
      }
      // PDF validation on pick
      if (form.type === 'pdf') {
        const isPdf = selectedFile.name.toLowerCase().endsWith('.pdf') && selectedFile.type === 'application/pdf';
        if (!isPdf) {
          toast.error('Selected file is not a valid PDF.');
          return;
        }
      }
      setFile(selectedFile);
      if (!form.title) {
        handleFormChange('title', selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const startUpload = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (form.type === 'pdf' && !file) {
      toast.error('Please choose a PDF file to upload.');
      return;
    }

    setSaving(true);
    setUploadFailed(false);
    setUploadProgress(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const payload = { subject, ...form };
      if (file) {
        setUploadProgress(5);
        payload.fileData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        payload.fileName = file.name;
        payload.fileSize = file.size;
        payload.fileMime = file.type;
      }

      await API.post('/study', payload, {
        signal: controller.signal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(Math.min(95, pct));
          }
        }
      });

      setUploadProgress(100);
      toast.success('Material added! ✅');
      onSaved();
    } catch (error) {
      if (error.name === 'CanceledError' || error.message?.includes('canceled') || error.message?.includes('aborted')) {
        toast('Upload cancelled.');
      } else {
        toast.error(error?.response?.data?.message || 'Failed to save');
        setUploadFailed(true);
      }
    } finally {
      setSaving(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    startUpload();
  };

  const inputClassName =
    'w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors placeholder:text-text-secondary/40';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-card w-full max-w-md p-6 md:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-extrabold text-lg">Add Material</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wide block mb-2">
              Type
            </label>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(MATERIAL_TYPES).map(([typeKey, typeMeta]) => (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => handleFormChange('type', typeKey)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-bold transition-all ${
                    form.type === typeKey
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-dark-border text-text-secondary hover:border-primary/40'
                  }`}
                >
                  <span className="text-lg">{typeMeta.icon}</span>
                  <span className="text-[10px]">{typeMeta.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wide block mb-1.5">
              Title *
            </label>
            <input
              required
              value={form.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              className={inputClassName}
              placeholder="e.g. Chapter 3 Notes"
            />
          </div>

          {form.type === 'note' && (
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wide block mb-1.5">
                Content
              </label>
              <textarea
                value={form.content}
                onChange={(e) => handleFormChange('content', e.target.value)}
                className={`${inputClassName} resize-none`}
                rows={5}
                placeholder="Write your notes here..."
              />
            </div>
          )}

          {(form.type === 'video' || form.type === 'book') && (
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wide block mb-1.5">
                URL / Link
              </label>
              <div className="relative">
                <Link
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                />
                <input
                  value={form.fileUrl}
                  onChange={(e) => handleFormChange('fileUrl', e.target.value)}
                  className={`${inputClassName} pl-8`}
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>
          )}

          {(form.type === 'pdf' || form.type === 'other') && (
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wide block mb-1.5">
                Upload File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept={form.type === 'pdf' ? '.pdf' : '*'}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-dark-border rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary/40 transition-colors text-text-secondary hover:text-primary"
              >
                <Upload size={20} />
                <span className="text-xs font-medium">
                  {file ? file.name : 'Tap to choose file (max 5MB)'}
                </span>
              </button>
              {file && (
                <p className="text-[10px] text-text-secondary mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
          )}

          {saving && (
            <div className="space-y-2 bg-dark-bg/60 border border-dark-border p-4 rounded-xl">
              <div className="flex justify-between text-xs font-bold">
                <span>Uploading file...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-dark-surface rounded-full h-2.5 overflow-hidden border border-dark-border">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="w-full mt-2 bg-red-500/20 text-red-400 border border-red-500/30 py-1.5 rounded-lg text-[10px] font-extrabold hover:bg-red-500/30 transition-all cursor-pointer uppercase tracking-wider"
              >
                Cancel Upload
              </button>
            </div>
          )}

          {uploadFailed && !saving && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs flex flex-col gap-2 animate-fadeIn">
              <p className="font-bold text-center">Upload Failed or Canceled.</p>
              <button
                type="button"
                onClick={startUpload}
                className="bg-primary text-white py-2 rounded-lg font-bold hover:bg-primary-hover transition-colors text-center cursor-pointer text-xs"
              >
                🔄 Retry Upload
              </button>
            </div>
          )}

          {!saving && !uploadFailed && (
            <button
              type="submit"
              className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              ✅ Save Material
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

function ViewMaterialModal({ material, onClose, API }) {
  const meta = MATERIAL_TYPES[material.type] || MATERIAL_TYPES.other;

  // Download Manager states
  const [downloadState, setDownloadState] = useState('idle'); // 'idle' | 'downloading' | 'paused' | 'failed' | 'completed'
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [chunks, setChunks] = useState([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  const activeRequestRef = useRef(null);
  const chunksRef = useRef([]);

  const totalSize = material.fileSize || 1024 * 1024;
  const CHUNK_SIZE = 512 * 1024; // 512KB chunks
  const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);

  // Clean up Blob URLs and pending downloads on unmount
  useEffect(() => {
    return () => {
      if (activeRequestRef.current) activeRequestRef.current.abort();
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  // Fetch cached material on load (offline/online cache check)
  useEffect(() => {
    if (material.type === 'pdf') {
      getCachedMaterialFile(material._id).then((cached) => {
        if (cached && cached.fileData) {
          const url = URL.createObjectURL(cached.fileData);
          setPdfBlobUrl(url);
          setDownloadState('completed');
          setShowPdfViewer(true);
        }
      });
    }
  }, [material._id, material.type]);

  const runDownload = async (startIndex) => {
    setDownloadState('downloading');
    let idx = startIndex;
    let bytesAccumulated = downloadedBytes;

    while (idx < totalChunks) {
      const start = idx * CHUNK_SIZE;
      const end = Math.min(totalSize - 1, start + CHUNK_SIZE - 1);

      const controller = new AbortController();
      activeRequestRef.current = controller;

      try {
        const response = await API.get(`/study/${material._id}/download`, {
          headers: { Range: `bytes=${start}-${end}` },
          responseType: 'arraybuffer',
          signal: controller.signal
        });

        const uint8 = new Uint8Array(response.data);
        chunksRef.current = [...chunksRef.current, uint8];
        setChunks(chunksRef.current);
        bytesAccumulated += uint8.length;
        setDownloadedBytes(bytesAccumulated);
        
        idx++;
        setCurrentChunkIndex(idx);
      } catch (err) {
        if (err.name === 'CanceledError' || err.message?.includes('canceled') || err.message?.includes('aborted')) {
          setDownloadState('paused');
          return;
        } else {
          console.error('Chunk download failed:', err);
          setDownloadState('failed');
          return;
        }
      } finally {
        activeRequestRef.current = null;
      }
    }

    try {
      const mergedBlob = new Blob(chunksRef.current, { type: 'application/pdf' });
      const url = URL.createObjectURL(mergedBlob);
      setPdfBlobUrl(url);
      setDownloadState('completed');
      await cacheMaterialFile(material._id, material.title, material.fileName, mergedBlob);
    } catch (err) {
      console.error('Failed to assemble PDF file:', err);
      setDownloadState('failed');
    }
  };

  const handleStartDownload = () => {
    chunksRef.current = [];
    setChunks([]);
    setDownloadedBytes(0);
    setCurrentChunkIndex(0);
    runDownload(0);
  };

  const handlePause = () => {
    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
    }
    setDownloadState('paused');
  };

  const handleResume = () => {
    runDownload(currentChunkIndex);
  };

  const handleRetry = () => {
    runDownload(currentChunkIndex);
  };

  const handleSaveLocally = () => {
    if (!pdfBlobUrl) return;
    const a = document.createElement('a');
    a.href = pdfBlobUrl;
    a.download = material.fileName || 'downloaded_document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Saved to device locally!');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-card w-full max-w-lg p-5 md:rounded-2xl rounded-t-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
          <span className="text-2xl">{meta.icon}</span>
          <div className="flex-1 min-w-0">
            <h2 className="font-extrabold truncate">{material.title}</h2>
            <p className="text-xs text-text-secondary">
              {material.subject} · {new Date(material.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {material.type === 'note' && (
            <div className="bg-dark-surface rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap min-h-[100px]">
              {material.content || (
                <span className="text-text-secondary italic">No content</span>
              )}
            </div>
          )}

          {(material.type === 'video' || material.type === 'book') && material.fileUrl && (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary break-all">{material.fileUrl}</p>
              <a
                href={material.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 bg-primary text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-primary-hover transition-colors w-full justify-center"
              >
                <ExternalLink size={16} /> Open Link
              </a>
            </div>
          )}

          {material.type === 'pdf' && (
            <div className="space-y-4">
              {downloadState === 'idle' && (
                <div className="bg-dark-surface border border-dark-border rounded-xl p-6 text-center flex flex-col items-center justify-center gap-3">
                  <p className="text-4xl font-extrabold">📄</p>
                  <div>
                    <p className="font-bold text-sm text-text-primary truncate max-w-[280px]">{material.fileName}</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      File Size: {(totalSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={handleStartDownload}
                    className="bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer shadow-md"
                  >
                    📥 Start PDF Download
                  </button>
                </div>
              )}

              {downloadState === 'downloading' && (
                <div className="bg-dark-surface border border-dark-border rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-primary">
                      <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      Downloading PDF...
                    </span>
                    <span className="text-text-secondary">
                      {Math.round((downloadedBytes * 100) / totalSize)}%
                    </span>
                  </div>
                  <div className="w-full bg-dark-bg rounded-full h-2.5 overflow-hidden border border-dark-border">
                    <div
                      className="bg-primary h-2.5 rounded-full transition-all duration-200"
                      style={{ width: `${Math.round((downloadedBytes * 100) / totalSize)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-text-secondary">
                    <span>
                      {(downloadedBytes / 1024 / 1024).toFixed(2)} MB / {(totalSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <span>Chunk {currentChunkIndex} of {totalChunks}</span>
                  </div>
                  <button
                    onClick={handlePause}
                    className="w-full bg-amber-500/20 text-amber-400 border border-amber-500/30 py-2 rounded-xl text-xs font-bold hover:bg-amber-500/30 transition-all cursor-pointer"
                  >
                    ⏸️ Pause Download
                  </button>
                </div>
              )}

              {downloadState === 'paused' && (
                <div className="bg-dark-surface border border-dark-border rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-text-secondary">
                    <span>Download Paused</span>
                    <span>{Math.round((downloadedBytes * 100) / totalSize)}%</span>
                  </div>
                  <div className="w-full bg-dark-bg rounded-full h-2.5 overflow-hidden border border-dark-border opacity-60">
                    <div
                      className="bg-amber-500 h-2.5 rounded-full"
                      style={{ width: `${Math.round((downloadedBytes * 100) / totalSize)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-text-secondary">
                    <span>
                      {(downloadedBytes / 1024 / 1024).toFixed(2)} MB / {(totalSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <span>Paused at Chunk {currentChunkIndex}</span>
                  </div>
                  <button
                    onClick={handleResume}
                    className="w-full bg-primary text-white py-2 rounded-xl text-xs font-bold hover:bg-primary-hover transition-all cursor-pointer"
                  >
                    ▶️ Resume Download
                  </button>
                </div>
              )}

              {downloadState === 'failed' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 space-y-3 text-red-400">
                  <p className="text-xs font-bold text-center">Connection error. Download failed.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRetry}
                      className="flex-1 bg-primary text-white py-2 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer"
                    >
                      🔄 Retry Download
                    </button>
                    <button
                      onClick={handleStartDownload}
                      className="flex-1 bg-dark-surface border border-dark-border text-text-secondary py-2 rounded-xl text-xs font-bold hover:text-white transition-colors cursor-pointer"
                    >
                      Restart From Scratch
                    </button>
                  </div>
                </div>
              )}

              {downloadState === 'completed' && (
                <div className="space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between text-emerald-400">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span>✅ Download Complete!</span>
                    </div>
                    <span className="text-xs">{(totalSize / 1024 / 1024).toFixed(2)} MB</span>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setShowPdfViewer(prev => !prev)}
                      className="flex-1 bg-primary text-white py-2.5 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                    >
                      👁️ {showPdfViewer ? 'Hide PDF' : 'Open PDF'}
                    </button>
                    <button
                      onClick={handleSaveLocally}
                      className="flex-1 bg-dark-surface border border-dark-border text-text-primary py-2.5 rounded-xl text-xs font-bold hover:bg-dark-border hover:text-primary transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      💾 Save to Device
                    </button>
                  </div>

                  {showPdfViewer && pdfBlobUrl && (
                    <iframe
                      src={pdfBlobUrl}
                      className="w-full h-[40vh] rounded-xl border border-dark-border animate-fadeIn"
                      title={material.title}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {material.type === 'other' && (
            <div className="bg-dark-surface rounded-xl p-6 text-center">
              <p className="text-3xl mb-2">📎</p>
              <p className="text-sm font-bold">{material.fileName || material.title}</p>
              {material.fileSize > 0 && (
                <p className="text-xs text-text-secondary mt-1">
                  {(material.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
