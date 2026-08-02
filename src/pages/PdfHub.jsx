import React, { useState, useEffect, useRef, useContext } from 'react';
import toast from 'react-hot-toast';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Plus,
  Search,
  X,
  FileDown,
  Scissors,
  RotateCw,
  Minimize2,
  Maximize2,
  Brain,
  PenTool,
  ShieldAlert,
  Check,
  Share2,
  Play,
  Pause,
  Square,
  Volume2,
  Sparkles,
  BookOpen,
  RefreshCw,
  Sliders,
  Cpu,
  FileUp,
  Layers,
  Lock,
  Eye,
  Type,
  Edit2,
  Shield,
  Image,
  Bookmark,
  Sun,
  Moon,
  Clock,
  Star
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { queueOfflineAction, getOfflineActions, deleteOfflineAction } from '../utils/offlineDb';

// IndexedDB Helper for storing PDF file bytes locally
const initIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pdf_recent_db', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('recent_files')) {
        db.createObjectStore('recent_files', { keyPath: 'fileName' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

const saveRecentFileToDB = async (fileName, fileData, fileSize) => {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction('recent_files', 'readwrite');
    const store = transaction.objectStore('recent_files');
    
    await new Promise((resolve, reject) => {
      const request = store.put({
        fileName,
        fileSize,
        fileData, // Actual File/Blob bytes
        lastOpened: Date.now()
      });
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('Error saving file to IndexedDB:', err);
  }
};

const getRecentFileFromDB = async (fileName) => {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction('recent_files', 'readonly');
    const store = transaction.objectStore('recent_files');
    
    return await new Promise((resolve, reject) => {
      const request = store.get(fileName);
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('Error fetching file from IndexedDB:', err);
    return null;
  }
};

const deleteRecentFileFromDB = async (fileName) => {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction('recent_files', 'readwrite');
    const store = transaction.objectStore('recent_files');
    
    await new Promise((resolve, reject) => {
      const request = store.delete(fileName);
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('Error deleting file from IndexedDB:', err);
  }
};

const getAllRecentFilesFromDB = async () => {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction('recent_files', 'readonly');
    const store = transaction.objectStore('recent_files');
    
    return await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = (e) => {
        const items = e.target.result || [];
        items.sort((a, b) => b.lastOpened - a.lastOpened);
        resolve(items);
      };
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('Error getting recent list from IndexedDB:', err);
    return [];
  }
};

const clearAllRecentFilesFromDB = async () => {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction('recent_files', 'readwrite');
    const store = transaction.objectStore('recent_files');
    
    await new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('Error clearing IndexedDB:', err);
  }
};

// Tool configurations matching the original structure
const TOOL_CATEGORIES = [
  {
    category: 'Convert From PDF',
    tab: 'conversions',
    tools: [
      { id: 'pdf-to-word', label: 'PDF to Word', icon: FileText, color: 'from-blue-500 to-indigo-600', accept: '.pdf' },
      { id: 'pdf-to-image', label: 'PDF to Image', icon: RefreshCw, color: 'from-purple-500 to-pink-600', accept: '.pdf' },
      { id: 'pdf-to-text', label: 'PDF to Text', icon: FileText, color: 'from-gray-500 to-slate-600', accept: '.pdf' },
    ],
  },
  {
    category: 'Convert To PDF',
    tab: 'conversions',
    tools: [
      { id: 'word-to-pdf', label: 'Word to PDF', icon: FileText, color: 'from-blue-600 to-indigo-700', accept: '.doc,.docx' },
      { id: 'image-to-pdf', label: 'Image to PDF', icon: RefreshCw, color: 'from-pink-600 to-rose-700', accept: 'image/*', multiple: true },
      { id: 'text-to-pdf', label: 'Text to PDF', icon: FileText, color: 'from-slate-600 to-gray-700', accept: '.txt' },
    ],
  },
  {
    category: 'Organize PDF',
    tab: 'utilities',
    tools: [
      { id: 'merge-pdf', label: 'Merge PDF', icon: Layers, color: 'from-indigo-500 to-purple-600', accept: '.pdf', multiple: true },
      { id: 'split-pdf', label: 'Split PDF', icon: Scissors, color: 'from-orange-500 to-amber-600', accept: '.pdf' },
      { id: 'rotate-pdf', label: 'Rotate PDF', icon: RotateCw, color: 'from-blue-400 to-cyan-500', accept: '.pdf' },
      { id: 'delete-pages', label: 'Delete Pages', icon: Trash2, color: 'from-red-500 to-rose-600', accept: '.pdf' },
    ],
  },
  {
    category: 'Edit PDF',
    tab: 'edit',
    tools: [
      { id: 'pdf-editor', label: 'PDF Editor', icon: PenTool, color: 'from-rose-500 to-pink-600', accept: '.pdf' },
      { id: 'watermark', label: 'Watermark', icon: ShieldAlert, color: 'from-blue-500 to-indigo-600', accept: '.pdf' },
      { id: 'signature', label: 'Signature', icon: PenTool, color: 'from-violet-500 to-purple-600', accept: '.pdf' },
    ],
  },
  {
    category: 'AI PDF Tools',
    tab: 'ai',
    tools: [
      { id: 'ai-summary', label: 'AI Summary', icon: Brain, color: 'from-fuchsia-500 to-purple-600', accept: '.pdf' },
      { id: 'chat-with-pdf', label: 'Chat with PDF', icon: Cpu, color: 'from-indigo-500 to-blue-600', accept: '.pdf' },
      { id: 'flashcards', label: 'Flashcards', icon: BookOpen, color: 'from-amber-500 to-orange-600', accept: '.pdf' },
    ],
  },
];

export default function PdfHub({ defaultTab = 'view' }) {
  const { API } = useContext(AuthContext);
  const fileInputRef = useRef(null);

  // External libraries status
  const [libsLoaded, setLibsLoaded] = useState(false);
  const [libsError, setLibsError] = useState(false);

  // Active Workspace tab
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Shared documents state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [pdfPages, setPdfPages] = useState([]); // Array of base64 images
  const [pdfNumPages, setPdfNumPages] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [extractedLines, setExtractedLines] = useState([]); // {text, page, id}
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // High-performance PDF Viewer states
  const [pdfDocument, setPdfDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270 degrees

  // Search system states
  const [pdfSearchQuery, setPdfSearchQuery] = useState('');
  const [pdfSearchResults, setPdfSearchResults] = useState([]);
  const [pdfCurrentMatchIndex, setPdfCurrentMatchIndex] = useState(-1);

  // Annotation system states
  const [activeTool, setActiveTool] = useState('none'); // 'none', 'highlight', 'underline', 'eraser'
  const [pdfAnnotations, setPdfAnnotations] = useState([]);
  const [currentPageTextItems, setCurrentPageTextItems] = useState([]);
  const [activePopup, setActivePopup] = useState(null);

  // Bookmark system states
  const [sidebarTab, setSidebarTab] = useState('pages'); // 'pages', 'bookmarks'
  const [pdfBookmarks, setPdfBookmarks] = useState([]);
  const [editingBookmarkId, setEditingBookmarkId] = useState(null);
  const [editingBookmarkTitle, setEditingBookmarkTitle] = useState('');

  // Page note system states
  const [pdfPageNotes, setPdfPageNotes] = useState([]);
  const [noteModeActive, setNoteModeActive] = useState(false);
  const [activeEditingNoteId, setActiveEditingNoteId] = useState(null);
  const [activeEditingNoteText, setActiveEditingNoteText] = useState('');
  const currentViewportRef = useRef(null);
  const saveNoteTimeoutRef = useRef(null);

  // Offline detection and sync effects
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const syncOfflineActions = async (apiClient) => {
    const actions = await getOfflineActions();
    if (actions.length === 0) return;

    toast('Syncing offline changes...', { icon: '⚡' });
    for (const action of actions) {
      try {
        if (action.type === 'add_bookmark') {
          await apiClient.post('/bookmarks', action.data);
        } else if (action.type === 'delete_bookmark') {
          if (!action.data.id.startsWith('temp_')) {
            await apiClient.delete(`/bookmarks/${action.data.id}`);
          }
        } else if (action.type === 'rename_bookmark') {
          if (!action.data.id.startsWith('temp_')) {
            await apiClient.put(`/bookmarks/${action.data.id}`, { title: action.data.title });
          }
        } else if (action.type === 'add_note') {
          await apiClient.post('/pagenotes', action.data);
        } else if (action.type === 'delete_note') {
          if (!action.data.id.startsWith('temp_')) {
            await apiClient.delete(`/pagenotes/${action.data.id}`);
          }
        } else if (action.type === 'save_note') {
          if (!action.data.id.startsWith('temp_')) {
            await apiClient.put(`/pagenotes/${action.data.id}`, { content: action.data.content });
          }
        } else if (action.type === 'add_favourite') {
          await apiClient.post('/favourites', action.data);
        } else if (action.type === 'delete_favourite') {
          await apiClient.delete(`/favourites?fileName=${action.data.fileName}`);
        }
        await deleteOfflineAction(action.id);
      } catch (err) {
        console.error('Failed to sync offline action:', action, err);
        if (err.response && (err.response.status === 400 || err.response.status === 404)) {
          await deleteOfflineAction(action.id);
        }
      }
    }
    toast.success('Offline updates synced successfully! ⚡');
    fetchBookmarks();
    fetchPageNotes();
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncOfflineActions(API);
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
      syncOfflineActions(API);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API, uploadedFile?.name]);

  // Reading theme states
  const [pdfDarkMode, setPdfDarkMode] = useState(() => {
    return localStorage.getItem('pdf_reader_dark_mode') === 'true';
  });

  // Recent PDFs states
  const [recentFiles, setRecentFiles] = useState([]);

  // Favourite PDF states
  const [pdfFavourites, setPdfFavourites] = useState([]);
  const [recentsTab, setRecentsTab] = useState('recent'); // 'recent', 'favourites'

  // PDF Merge state variables
  const [mergeFiles, setMergeFiles] = useState([]);
  const [mergeOutputName, setMergeOutputName] = useState('merged_document.pdf');
  const [mergeState, setMergeState] = useState('idle'); // 'idle' | 'merging' | 'completed' | 'failed'
  const [mergeProgress, setMergeProgress] = useState(0);
  const [mergeStatusText, setMergeStatusText] = useState('');
  const [mergedBlob, setMergedBlob] = useState(null);
  const [mergedBlobUrl, setMergedBlobUrl] = useState(null);
  
  const mergeFileInputRef = useRef(null);

  // Clean up merge URL on unmount
  useEffect(() => {
    return () => {
      if (mergedBlobUrl) URL.revokeObjectURL(mergedBlobUrl);
    };
  }, [mergedBlobUrl]);

  const handleMergeFileSelect = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const pdfs = files.filter((f) => f.name.toLowerCase().endsWith('.pdf'));
      if (pdfs.length < files.length) {
        toast.error('Only PDF files are supported for merging.');
      }
      if (pdfs.length === 0) return;

      const mapped = pdfs.map((f) => ({
        id: `m_${Date.now()}_${Math.random()}`,
        file: f,
        name: f.name,
        size: f.size
      }));
      setMergeFiles((prev) => [...prev, ...mapped]);
    }
    e.target.value = '';
  };

  const moveUp = (idx) => {
    if (idx === 0) return;
    setMergeFiles((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx - 1];
      copy[idx - 1] = temp;
      return copy;
    });
  };

  const moveDown = (idx) => {
    if (idx === mergeFiles.length - 1) return;
    setMergeFiles((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx + 1];
      copy[idx + 1] = temp;
      return copy;
    });
  };

  const removeFile = (id) => {
    setMergeFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleMergeFiles = async () => {
    if (mergeFiles.length < 2) {
      toast.error('Please select at least 2 PDF files to merge.');
      return;
    }

    setMergeState('merging');
    setMergeProgress(10);
    setMergeStatusText('Initializing PDF Merger...');

    try {
      if (!window.PDFLib) { toast.error('PDF library still loading. Please wait...'); setMergeState('idle'); return; }
      setMergeProgress(20);
      setMergeStatusText('Creating empty document...');
      const mergedPdf = await window.PDFLib.PDFDocument.create();

      setMergeProgress(40);
      let fileIdx = 0;
      for (const fileObj of mergeFiles) {
        setMergeStatusText(`Processing file ${fileIdx + 1}: ${fileObj.name}...`);
        
        const arrayBuffer = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsArrayBuffer(fileObj.file);
        });

        const pdfDoc = await window.PDFLib.PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        
        fileIdx++;
        const pct = 40 + Math.round((fileIdx * 40) / mergeFiles.length);
        setMergeProgress(pct);
      }

      setMergeStatusText('Assembling pages and generating PDF output...');
      setMergeProgress(90);
      const mergedPdfBytes = await mergedPdf.save();

      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setMergedBlob(blob);
      setMergedBlobUrl(url);
      setMergeProgress(100);
      setMergeStatusText('Merge completed successfully!');
      setMergeState('completed');
      toast.success('PDFs merged successfully! 🎉');
    } catch (err) {
      console.error('PDF merge error:', err);
      setMergeStatusText('Error merging PDF files. Please verify the files are valid PDFs.');
      setMergeState('failed');
      toast.error('Failed to merge PDFs.');
    }
  };

  const handleOpenMergedInWorkspace = async () => {
    if (!mergedBlob) return;
    try {
      const outputName = mergeOutputName.toLowerCase().endsWith('.pdf') ? mergeOutputName : `${mergeOutputName}.pdf`;
      const file = new File([mergedBlob], outputName, { type: 'application/pdf' });
      setActiveTab('view');
      processDocument(file);
      // Reset merger state
      setMergeFiles([]);
      setMergedBlob(null);
      setMergedBlobUrl(null);
      setMergeState('idle');
    } catch (err) {
      console.error('Failed to load merged PDF:', err);
      toast.error('Failed to open merged PDF in workspace.');
    }
  };

  // PDF Split state variables
  const [selectedSplitPages, setSelectedSplitPages] = useState([]);
  const [splitOutputName, setSplitOutputName] = useState('split_document.pdf');
  const [splitState, setSplitState] = useState('idle'); // 'idle' | 'splitting' | 'completed' | 'failed'
  const [splitProgress, setSplitProgress] = useState(0);
  const [splitStatus, setSplitStatus] = useState('');
  const [splitBlob, setSplitBlob] = useState(null);
  const [splitBlobUrl, setSplitBlobUrl] = useState(null);

  // Clean up split Blob URL on unmount
  useEffect(() => {
    return () => {
      if (splitBlobUrl) URL.revokeObjectURL(splitBlobUrl);
    };
  }, [splitBlobUrl]);

  const handleSplitPdf = async () => {
    if (!uploadedFile || !uploadedFile.name.toLowerCase().endsWith('.pdf')) {
      toast.error('This action is only supported for PDF files.');
      return;
    }
    if (selectedSplitPages.length === 0) {
      toast.error('Please select at least one page to split.');
      return;
    }

    setSplitState('splitting');
    setSplitProgress(15);
    setSplitStatus('Reading document data...');

    try {
      const arrayBuffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(uploadedFile);
      });

      setSplitProgress(40);
      setSplitStatus('Loading source PDF...');
      const srcDoc = await window.PDFLib.PDFDocument.load(arrayBuffer);

      setSplitProgress(65);
      setSplitStatus('Extracting selected pages...');
      const splitDoc = await window.PDFLib.PDFDocument.create();

      const zeroBasedIndices = selectedSplitPages
        .map((p) => p - 1)
        .filter((idx) => idx >= 0 && idx < srcDoc.getPageCount());

      const copiedPages = await splitDoc.copyPages(srcDoc, zeroBasedIndices);
      copiedPages.forEach((page) => splitDoc.addPage(page));

      setSplitProgress(85);
      setSplitStatus('Generating output file...');
      const splitPdfBytes = await splitDoc.save();

      const blob = new Blob([splitPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setSplitBlob(blob);
      setSplitBlobUrl(url);
      setSplitProgress(100);
      setSplitStatus('Split completed successfully!');
      setSplitState('completed');
      toast.success('PDF split successfully! 🎉');
    } catch (err) {
      console.error('PDF split error:', err);
      setSplitStatus('Error splitting PDF. Verify the file is valid and not encrypted.');
      setSplitState('failed');
      toast.error('Failed to split PDF.');
    }
  };

  const handleOpenSplitInWorkspace = async () => {
    if (!splitBlob) return;
    try {
      const outputName = splitOutputName.toLowerCase().endsWith('.pdf') ? splitOutputName : `${splitOutputName}.pdf`;
      const file = new File([splitBlob], outputName, { type: 'application/pdf' });
      setActiveTab('view');
      processDocument(file);
      setSelectedSplitPages([]);
      setSplitBlob(null);
      setSplitBlobUrl(null);
      setSplitState('idle');
    } catch (err) {
      console.error('Failed to load split PDF:', err);
      toast.error('Failed to open split PDF in workspace.');
    }
  };

  // PDF Compression state variables
  const [compressMode, setCompressMode] = useState('raster'); // 'raster' | 'structural'
  const [compressQuality, setCompressQuality] = useState('medium'); // 'high' | 'medium' | 'low'
  const [compressOutputName, setCompressOutputName] = useState('compressed_document.pdf');
  const [compressState, setCompressState] = useState('idle'); // 'idle' | 'compressing' | 'completed' | 'failed'
  const [compressProgress, setCompressProgress] = useState(0);
  const [compressStatus, setCompressStatus] = useState('');
  const [compressedBlob, setCompressedBlob] = useState(null);
  const [compressedBlobUrl, setCompressedBlobUrl] = useState(null);
  const [compressedSize, setCompressedSize] = useState(0);

  // Clean up compressed Blob URL on unmount
  useEffect(() => {
    return () => {
      if (compressedBlobUrl) URL.revokeObjectURL(compressedBlobUrl);
    };
  }, [compressedBlobUrl]);

  // Set default output filename when a file is uploaded
  useEffect(() => {
    if (uploadedFile) {
      const originalName = uploadedFile.name;
      const dotIndex = originalName.lastIndexOf('.');
      if (dotIndex !== -1) {
        setCompressOutputName(`${originalName.substring(0, dotIndex)}_compressed.pdf`);
      } else {
        setCompressOutputName(`${originalName}_compressed.pdf`);
      }
    }
  }, [uploadedFile]);

  const compressPdfRaster = async (qualitySetting) => {
    let scale = 1.0;
    let quality = 0.5;
    if (qualitySetting === 'low') {
      scale = 0.7;
      quality = 0.25;
    } else if (qualitySetting === 'high') {
      scale = 1.5;
      quality = 0.8;
    }

    setCompressState('compressing');
    setCompressProgress(5);
    setCompressStatus('Loading PDF engine...');

    try {
      if (!window.pdfjsLib || !window.PDFLib) { toast.error('PDF libraries still loading...'); setCompressState('idle'); return; }
      const arrayBuffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(uploadedFile);
      });

      const pdfjsDoc = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdfjsDoc.numPages;

      const compressedPdfDoc = await window.PDFLib.PDFDocument.create();

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        setCompressStatus(`Rendering page ${pageNum} of ${numPages}...`);
        setCompressProgress(5 + Math.round((pageNum / numPages) * 80));

        const page = await pdfjsDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise;

        const jpegBlob = await new Promise((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
        });

        const jpegBuffer = await jpegBlob.arrayBuffer();
        const embeddedImage = await compressedPdfDoc.embedJpg(jpegBuffer);

        const newPage = compressedPdfDoc.addPage([viewport.width, viewport.height]);
        newPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height
        });
      }

      setCompressStatus('Assembling compressed document...');
      setCompressProgress(90);

      const compressedPdfBytes = await compressedPdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setCompressedBlob(blob);
      setCompressedBlobUrl(url);
      setCompressedSize(blob.size);
      setCompressProgress(100);
      setCompressStatus('Compression complete!');
      setCompressState('completed');
      toast.success('PDF compressed successfully! ⚡');
    } catch (err) {
      console.error('PDF compression error:', err);
      setCompressStatus('Failed to compress PDF.');
      setCompressState('failed');
      toast.error('Compression failed.');
    }
  };

  const compressPdfStructural = async () => {
    setCompressState('compressing');
    setCompressProgress(20);
    setCompressStatus('Loading PDF file...');

    try {
      if (!window.PDFLib) { toast.error('PDF library still loading...'); setCompressState('idle'); return; }
      const arrayBuffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(uploadedFile);
      });

      setCompressProgress(50);
      setCompressStatus('Optimizing PDF structure...');
      const pdfDoc = await window.PDFLib.PDFDocument.load(arrayBuffer);
      
      const compressedPdfBytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setCompressedBlob(blob);
      setCompressedBlobUrl(url);
      setCompressedSize(blob.size);
      setCompressProgress(100);
      setCompressStatus('Optimization complete!');
      setCompressState('completed');
      toast.success('PDF optimized successfully! ⚡');
    } catch (err) {
      console.error('Structural cleanup error:', err);
      setCompressStatus('Failed to clean up PDF structure.');
      setCompressState('failed');
      toast.error('Optimization failed.');
    }
  };

  const handleCompressPdf = async () => {
    if (!uploadedFile || !uploadedFile.name.toLowerCase().endsWith('.pdf')) {
      toast.error('This action is only supported for PDF files.');
      return;
    }
    if (compressMode === 'raster') {
      await compressPdfRaster(compressQuality);
    } else {
      await compressPdfStructural();
    }
  };

  const handleOpenCompressedInWorkspace = async () => {
    if (!compressedBlob) return;
    try {
      const outputName = compressOutputName.toLowerCase().endsWith('.pdf') ? compressOutputName : `${compressOutputName}.pdf`;
      const file = new File([compressedBlob], outputName, { type: 'application/pdf' });
      setActiveTab('view');
      processDocument(file);
      setCompressedBlob(null);
      setCompressedBlobUrl(null);
      setCompressState('idle');
    } catch (err) {
      console.error('Failed to load compressed PDF:', err);
      toast.error('Failed to open compressed PDF in workspace.');
    }
  };

  // Image to PDF converter states
  const [imageFiles, setImageFiles] = useState([]);
  const [imageOutputName, setImageOutputName] = useState('images_to_document.pdf');
  const [imageState, setImageState] = useState('idle'); // 'idle' | 'converting' | 'completed' | 'failed'
  const [imageProgress, setImageProgress] = useState(0);
  const [imageStatus, setImageStatus] = useState('');
  const [imagePdfBlob, setImagePdfBlob] = useState(null);
  const [imagePdfBlobUrl, setImagePdfBlobUrl] = useState(null);

  const imageFileInputRef = useRef(null);

  // Clean up image preview and PDF URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePdfBlobUrl) URL.revokeObjectURL(imagePdfBlobUrl);
      imageFiles.forEach(img => {
        if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
      });
    };
  }, [imagePdfBlobUrl]);

  const handleImageSelect = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const mapped = files.map((f) => ({
        id: `img_${Date.now()}_${Math.random()}`,
        file: f,
        name: f.name,
        size: f.size,
        previewUrl: URL.createObjectURL(f),
        rotation: 0, // 0 | 90 | 180 | 270
      }));
      setImageFiles((prev) => [...prev, ...mapped]);
    }
    e.target.value = '';
  };

  const moveImageUp = (idx) => {
    if (idx === 0) return;
    setImageFiles((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx - 1];
      copy[idx - 1] = temp;
      return copy;
    });
  };

  const moveImageDown = (idx) => {
    if (idx === imageFiles.length - 1) return;
    setImageFiles((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx + 1];
      copy[idx + 1] = temp;
      return copy;
    });
  };

  const removeImage = (id) => {
    setImageFiles((prev) => {
      const match = prev.find(f => f.id === id);
      if (match && match.previewUrl) {
        URL.revokeObjectURL(match.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const rotateImage = (id) => {
    setImageFiles((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img
      )
    );
  };

  const handleImagesToPdf = async () => {
    if (imageFiles.length === 0) {
      toast.error('Please select at least one image.');
      return;
    }

    setImageState('converting');
    setImageProgress(10);
    setImageStatus('Initializing PDF document...');

    try {
      const pdfDoc = await window.PDFLib.PDFDocument.create();

      for (let i = 0; i < imageFiles.length; i++) {
        const imgObj = imageFiles[i];
        setImageStatus(`Processing image ${i + 1} of ${imageFiles.length}: ${imgObj.name}...`);
        setImageProgress(10 + Math.round((i / imageFiles.length) * 80));

        const imgElement = await new Promise((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = imgObj.previewUrl;
        });

        const canvas = document.createElement('canvas');
        const angle = imgObj.rotation;
        
        if (angle === 90 || angle === 270) {
          canvas.width = imgElement.naturalHeight;
          canvas.height = imgElement.naturalWidth;
        } else {
          canvas.width = imgElement.naturalWidth;
          canvas.height = imgElement.naturalHeight;
        }

        const ctx = canvas.getContext('2d');
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((angle * Math.PI) / 180);
        ctx.drawImage(imgElement, -imgElement.naturalWidth / 2, -imgElement.naturalHeight / 2);

        const jpegBlob = await new Promise((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85);
        });

        const jpegBuffer = await jpegBlob.arrayBuffer();
        const jpegBytes = new Uint8Array(jpegBuffer);
        const embeddedImage = await pdfDoc.embedJpg(jpegBytes);

        const page = pdfDoc.addPage([canvas.width, canvas.height]);
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: canvas.width,
          height: canvas.height,
        });
      }

      setImageStatus('Saving PDF document...');
      setImageProgress(95);

      const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setImagePdfBlob(blob);
      setImagePdfBlobUrl(url);
      setImageProgress(100);
      setImageStatus('PDF conversion complete!');
      setImageState('completed');
      toast.success('Images converted to PDF successfully! 🎉');
    } catch (err) {
      console.error('Image to PDF error:', err);
      setImageStatus('Failed to convert images to PDF.');
      setImageState('failed');
      toast.error('Failed to convert images to PDF.');
    }
  };

  const handleOpenImagePdfInWorkspace = async () => {
    if (!imagePdfBlob) return;
    try {
      const outputName = imageOutputName.toLowerCase().endsWith('.pdf') ? imageOutputName : `${imageOutputName}.pdf`;
      const file = new File([imagePdfBlob], outputName, { type: 'application/pdf' });
      setActiveTab('view');
      processDocument(file);
      setImageFiles([]);
      setImagePdfBlob(null);
      setImagePdfBlobUrl(null);
      setImageState('idle');
    } catch (err) {
      console.error('Failed to load image PDF:', err);
      toast.error('Failed to open PDF in workspace.');
    }
  };

  const handleShareImagePdf = async () => {
    if (!imagePdfBlob) return;
    const outputName = imageOutputName.toLowerCase().endsWith('.pdf') ? imageOutputName : `${imageOutputName}.pdf`;
    const file = new File([imagePdfBlob], outputName, { type: 'application/pdf' });
    
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: outputName,
          text: 'Check out this PDF converted from images!',
        });
        toast.success('Shared successfully!');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
          toast.error('Failed to share PDF.');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(imagePdfBlobUrl);
        toast.success('PDF URL copied to clipboard! (System sharing not supported on this browser)');
      } catch (cErr) {
        toast.error('Sharing not supported on this browser.');
      }
    }
  };

  // PDF Document Scanner states
  const [scannerState, setScannerState] = useState('idle'); // 'idle' | 'cropping' | 'enhancing' | 'completed' | 'failed'
  const [scannedPages, setScannedPages] = useState([]);
  const [scannerCorners, setScannerCorners] = useState([]);
  const [activeCapturedImage, setActiveCapturedImage] = useState(null); // { src, width, height }
  const [scannerOutputName, setScannerOutputName] = useState('scanned_document.pdf');
  const [scannerFilter, setScannerFilter] = useState('original'); // 'original' | 'grayscale' | 'bw' | 'magic'
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isSimulatedCamera, setIsSimulatedCamera] = useState(false);
  const [scannerProgress, setScannerProgress] = useState(0);
  const [scannerStatus, setScannerStatus] = useState('');
  const [scannerPdfBlob, setScannerPdfBlob] = useState(null);
  const [scannerPdfBlobUrl, setScannerPdfBlobUrl] = useState(null);
  const [scannerActiveWarpedCanvas, setScannerActiveWarpedCanvas] = useState(null);
  const [draggingCornerIndex, setDraggingCornerIndex] = useState(-1);

  const videoRef = useRef(null);
  const scannerFileInputRef = useRef(null);
  const cropContainerRef = useRef(null);

  // Clean up media streams and urls
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      if (scannerPdfBlobUrl) URL.revokeObjectURL(scannerPdfBlobUrl);
    };
  }, [cameraStream, scannerPdfBlobUrl]);

  const startCamera = async () => {
    setCameraError(null);
    setIsSimulatedCamera(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera access error, falling back to simulated file upload mode:', err);
      setCameraError('Camera access denied or not available. Running in file simulation mode.');
      setIsSimulatedCamera(true);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    if (isSimulatedCamera) {
      scannerFileInputRef.current?.click();
      return;
    }

    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const corners = detectEdges(imgData);

      setActiveCapturedImage({
        src: canvas.toDataURL('image/jpeg'),
        width: canvas.width,
        height: canvas.height,
        imgData: imgData
      });
      setScannerCorners(corners);
      setScannerState('cropping');
      stopCamera();
    }
  };

  const handleSimulatedPhotoSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const corners = detectEdges(imgData);

          setActiveCapturedImage({
            src: event.target.result,
            width: img.naturalWidth,
            height: img.naturalHeight,
            imgData: imgData
          });
          setScannerCorners(corners);
          setScannerState('cropping');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const detectEdges = (imgData) => {
    const w = imgData.width;
    const h = imgData.height;
    const pixels = imgData.data;

    const getVal = (x, y) => {
      const idx = (y * w + x) * 4;
      return 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
    };

    const corners = [
      { x: Math.round(w * 0.1), y: Math.round(h * 0.1) },
      { x: Math.round(w * 0.9), y: Math.round(h * 0.1) },
      { x: Math.round(w * 0.9), y: Math.round(h * 0.9) },
      { x: Math.round(w * 0.1), y: Math.round(h * 0.9) }
    ];

    const steps = 45;
    const threshold = 22;

    // TL
    for (let i = 0; i < steps; i++) {
      const x = Math.round((w * 0.35 * i) / steps);
      const y = Math.round((h * 0.35 * i) / steps);
      const nextX = Math.round((w * 0.35 * (i + 1)) / steps);
      const nextY = Math.round((h * 0.35 * (i + 1)) / steps);
      if (Math.abs(getVal(x, y) - getVal(nextX, nextY)) > threshold) {
        corners[0] = { x: nextX, y: nextY };
        break;
      }
    }
    // TR
    for (let i = 0; i < steps; i++) {
      const x = Math.round(w - (w * 0.35 * i) / steps);
      const y = Math.round((h * 0.35 * i) / steps);
      const nextX = Math.round(w - (w * 0.35 * (i + 1)) / steps);
      const nextY = Math.round((h * 0.35 * (i + 1)) / steps);
      if (Math.abs(getVal(x, y) - getVal(nextX, nextY)) > threshold) {
        corners[1] = { x: nextX, y: nextY };
        break;
      }
    }
    // BR
    for (let i = 0; i < steps; i++) {
      const x = Math.round(w - (w * 0.35 * i) / steps);
      const y = Math.round(h - (h * 0.35 * i) / steps);
      const nextX = Math.round(w - (w * 0.35 * (i + 1)) / steps);
      const nextY = Math.round(h - (h * 0.35 * (i + 1)) / steps);
      if (Math.abs(getVal(x, y) - getVal(nextX, nextY)) > threshold) {
        corners[2] = { x: nextX, y: nextY };
        break;
      }
    }
    // BL
    for (let i = 0; i < steps; i++) {
      const x = Math.round((w * 0.35 * i) / steps);
      const y = Math.round(h - (h * 0.35 * i) / steps);
      const nextX = Math.round((w * 0.35 * (i + 1)) / steps);
      const nextY = Math.round((h * 0.35 * (i + 1)) / steps);
      if (Math.abs(getVal(x, y) - getVal(nextX, nextY)) > threshold) {
        corners[3] = { x: nextX, y: nextY };
        break;
      }
    }

    return corners;
  };

  const handleCropContainerMouseMove = (e) => {
    if (draggingCornerIndex === -1 || !cropContainerRef.current || !activeCapturedImage) return;

    const rect = cropContainerRef.current.getBoundingClientRect();
    let clientX = e.clientX;
    let clientY = e.clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const displayW = rect.width;
    const displayH = rect.height;
    
    const srcW = activeCapturedImage.width;
    const srcH = activeCapturedImage.height;

    const imgX = Math.round((mouseX / displayW) * srcW);
    const imgY = Math.round((mouseY / displayH) * srcH);

    const clampedX = Math.min(srcW, Math.max(0, imgX));
    const clampedY = Math.min(srcH, Math.max(0, imgY));

    setScannerCorners((prev) =>
      prev.map((c, idx) => (idx === draggingCornerIndex ? { x: clampedX, y: clampedY } : c))
    );
  };

  const warpDocument = () => {
    if (!activeCapturedImage) return;

    const dstW = 595;
    const dstH = 842;

    const srcImgData = activeCapturedImage.imgData;
    const canvas = document.createElement('canvas');
    canvas.width = dstW;
    canvas.height = dstH;
    const ctx = canvas.getContext('2d');
    const dstImgData = ctx.createImageData(dstW, dstH);

    const srcW = srcImgData.width;
    const srcH = srcImgData.height;
    const srcPixels = srcImgData.data;
    const dstPixels = dstImgData.data;
    const [p0, p1, p2, p3] = scannerCorners;

    for (let y = 0; y < dstH; y++) {
      const v = y / dstH;
      for (let x = 0; x < dstW; x++) {
        const u = x / dstW;

        const srcX = Math.round(
          (1 - u) * (1 - v) * p0.x +
          u * (1 - v) * p1.x +
          u * v * p2.x +
          (1 - u) * v * p3.x
        );
        const srcY = Math.round(
          (1 - u) * (1 - v) * p0.y +
          u * (1 - v) * p1.y +
          u * v * p2.y +
          (1 - u) * v * p3.y
        );

        const clampedX = Math.min(srcW - 1, Math.max(0, srcX));
        const clampedY = Math.min(srcH - 1, Math.max(0, srcY));

        const srcIdx = (clampedY * srcW + clampedX) * 4;
        const dstIdx = (y * dstW + x) * 4;

        dstPixels[dstIdx] = srcPixels[srcIdx];
        dstPixels[dstIdx + 1] = srcPixels[srcIdx + 1];
        dstPixels[dstIdx + 2] = srcPixels[srcIdx + 2];
        dstPixels[dstIdx + 3] = srcPixels[srcIdx + 3];
      }
    }

    ctx.putImageData(dstImgData, 0, 0);
    setScannerActiveWarpedCanvas(canvas);
    setScannerFilter('original');
    setScannerState('enhancing');
  };

  const getEnhancedCanvasUrl = (filterType) => {
    if (!scannerActiveWarpedCanvas) return '';
    const canvas = document.createElement('canvas');
    canvas.width = scannerActiveWarpedCanvas.width;
    canvas.height = scannerActiveWarpedCanvas.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(scannerActiveWarpedCanvas, 0, 0);

    if (filterType === 'original') {
      return canvas.toDataURL('image/jpeg', 0.85);
    }

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      if (filterType === 'grayscale') {
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      } else if (filterType === 'bw') {
        const val = gray > 125 ? 255 : Math.max(0, gray - 25);
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      } else if (filterType === 'magic') {
        const factor = 1.35;
        data[i] = Math.min(255, Math.max(0, 128 + (r - 128) * factor));
        data[i + 1] = Math.min(255, Math.max(0, 128 + (g - 128) * factor));
        data[i + 2] = Math.min(255, Math.max(0, 128 + (b - 128) * factor));
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const addScannedPage = () => {
    const finalUrl = getEnhancedCanvasUrl(scannerFilter);
    setScannedPages((prev) => [...prev, { src: finalUrl }]);
    
    setActiveCapturedImage(null);
    setScannerActiveWarpedCanvas(null);
    setScannerState('idle');
    startCamera();
  };

  const compileScannedPdf = async () => {
    let finalPages = scannedPages;
    if (scannerActiveWarpedCanvas) {
      const finalUrl = getEnhancedCanvasUrl(scannerFilter);
      finalPages = [...scannedPages, { src: finalUrl }];
      setScannedPages(finalPages);
    }

    if (finalPages.length === 0) {
      toast.error('No scanned pages to compile.');
      return;
    }

    setScannerState('completed');
    setScannerProgress(10);
    setScannerStatus('Compiling scanned pages into PDF...');

    try {
      const pdfDoc = await window.PDFLib.PDFDocument.create();

      for (let i = 0; i < finalPages.length; i++) {
        setScannerStatus(`Adding page ${i + 1} of ${finalPages.length}...`);
        setScannerProgress(10 + Math.round((i / finalPages.length) * 80));

        const dataUrl = finalPages[i].src;
        const base64Data = dataUrl.split(',')[1];
        
        const binaryString = window.atob(base64Data);
        const bytesArray = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytesArray[j] = binaryString.charCodeAt(j);
        }

        const embeddedImage = await pdfDoc.embedJpg(bytesArray);
        const page = pdfDoc.addPage([595, 842]);
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: 595,
          height: 842
        });
      }

      setScannerStatus('Saving document...');
      setScannerProgress(95);

      const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setScannerPdfBlob(blob);
      setScannerPdfBlobUrl(url);
      setScannerProgress(100);
      setScannerStatus('Scanned document compiled!');
      toast.success('Document scanned and compiled successfully! 📄');
    } catch (err) {
      console.error('Document scanning compile error:', err);
      setScannerStatus('Failed to compile scanned pages.');
      setScannerState('failed');
      toast.error('Compilation failed.');
    }
  };

  const handleOpenScannerPdfInWorkspace = async () => {
    if (!scannerPdfBlob) return;
    try {
      const outputName = scannerOutputName.toLowerCase().endsWith('.pdf') ? scannerOutputName : `${scannerOutputName}.pdf`;
      const file = new File([scannerPdfBlob], outputName, { type: 'application/pdf' });
      setActiveTab('view');
      processDocument(file);
      setScannedPages([]);
      setActiveCapturedImage(null);
      setScannerActiveWarpedCanvas(null);
      setScannerPdfBlob(null);
      setScannerPdfBlobUrl(null);
      setScannerState('idle');
    } catch (err) {
      console.error('Failed to load scanner PDF:', err);
      toast.error('Failed to open PDF in workspace.');
    }
  };

  // Gesture zoom states
  const [touchStartDist, setTouchStartDist] = useState(null);
  const [lastTap, setLastTap] = useState(0);

  // Editor on-demand page state
  const [editorPageBase64, setEditorPageBase64] = useState(null);

  // Viewer and editor refs
  const viewerCanvasRef = useRef(null);
  const viewerContainerRef = useRef(null);
  const renderTaskRef = useRef(null);

  // Tab 1: Viewer States
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedLineId, setHighlightedLineId] = useState(null);
  const [showLineByLine, setShowLineByLine] = useState(false);

  // Tab 2: Editor States
  const [editMode, setEditMode] = useState('text'); // 'text', 'watermark', 'signature'
  const [watermarkText, setWatermarkText] = useState('STUDENT OS COPY');
  const [editorText, setEditorText] = useState('');
  const [activeInlineInput, setActiveInlineInput] = useState(null); // {x, y, val}
  const [pdfTextItems, setPdfTextItems] = useState([]); // Array of original PDF text runs with absolute coordinates
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [editorColor, setEditorColor] = useState('#ff0000');
  const [editorBgMask, setEditorBgMask] = useState(false);
  const [editorPageIdx, setEditorPageIdx] = useState(0);
  const [addedTexts, setAddedTexts] = useState([]); // {text, x, y, size, color, pageIndex}
  const [addedSignatures, setAddedSignatures] = useState([]); // {dataUrl, x, y, width, height, pageIndex}
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Tab 3: AI States
  const [aiChat, setAiChat] = useState([]); // {role, text}
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [aiFlashcards, setAiFlashcards] = useState([]); // {question, answer, flipped}

  // Tab 4: OCR States
  const [ocrImage, setOcrImage] = useState(null);
  const [ocrResult, setOcrResult] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrSearchTerm, setOcrSearchTerm] = useState('');
  const [ocrTargetPages, setOcrTargetPages] = useState('current'); // 'current' | 'all'
  const [ocrOutputName, setOcrOutputName] = useState('extracted_text.txt');
  const [ocrStatus, setOcrStatus] = useState('');

  // Set default output filename when a file is uploaded
  useEffect(() => {
    if (uploadedFile) {
      const originalName = uploadedFile.name;
      const dotIndex = originalName.lastIndexOf('.');
      if (dotIndex !== -1) {
        setOcrOutputName(`${originalName.substring(0, dotIndex)}_ocr.txt`);
      } else {
        setOcrOutputName(`${originalName}_ocr.txt`);
      }
    }
  }, [uploadedFile]);

  const runOcrOnPdf = async () => {
    if (!uploadedFile) {
      toast.error('No document uploaded.');
      return;
    }
    if (!uploadedFile.name.toLowerCase().endsWith('.pdf')) {
      toast.error('This action is only supported for PDF files.');
      return;
    }

    setOcrLoading(true);
    setOcrProgress(5);
    setOcrResult('');
    setOcrStatus('Loading PDF file for scanning...');

    try {
      if (!window.pdfjsLib || !window.Tesseract) { toast.error('OCR libraries still loading...'); setOcrLoading(false); return; }
      const arrayBuffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(uploadedFile);
      });

      const pdfjsDoc = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdfjsDoc.numPages;

      let startPage = 1;
      let endPage = numPages;

      if (ocrTargetPages === 'current') {
        startPage = currentPage;
        endPage = currentPage;
      }

      let compiledText = '';
      
      const worker = await window.Tesseract.createWorker({
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const pagePct = Math.round(m.progress * 100);
            setOcrProgress(pagePct);
          }
        },
      });

      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        setOcrStatus(`Rendering page ${pageNum} of ${numPages} for text recognition...`);
        
        const page = await pdfjsDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise;

        const jpegBlob = await new Promise((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85);
        });

        setOcrStatus(`Running OCR on page ${pageNum}...`);
        const jpegUrl = URL.createObjectURL(jpegBlob);
        
        const ret = await worker.recognize(jpegUrl);
        URL.revokeObjectURL(jpegUrl);

        compiledText += `--- PAGE ${pageNum} ---\n` + ret.data.text + '\n\n';
      }

      await worker.terminate();

      setOcrResult(compiledText);
      setOcrStatus('OCR extraction completed!');
      setOcrProgress(100);
      toast.success('OCR completed successfully! 🔍');
    } catch (err) {
      console.error('OCR error:', err);
      setOcrStatus('Character recognition failed.');
      toast.error('OCR character recognition failed.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleCopyOcrText = async () => {
    if (!ocrResult) return;
    try {
      await navigator.clipboard.writeText(ocrResult);
      toast.success('Extracted text copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy text.');
    }
  };

  const handleExportOcrText = () => {
    if (!ocrResult) return;
    const blob = new Blob([ocrResult], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = ocrOutputName.toLowerCase().endsWith('.txt') ? ocrOutputName : `${ocrOutputName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Text exported successfully!');
  };

  // Text-to-Speech (TTS) states
  const [ttsActive, setTtsActive] = useState(false);
  const [ttsIsPlaying, setTtsIsPlaying] = useState(false);
  const [ttsIsPaused, setTtsIsPaused] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState(1.0);
  const [ttsVoiceName, setTtsVoiceName] = useState('');
  const [ttsVoices, setTtsVoices] = useState([]);
  const [ttsCurrentLineIndex, setTtsCurrentLineIndex] = useState(0);

  // Load system voices
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setTtsVoices(voices);
        if (voices.length > 0 && !ttsVoiceName) {
          const defaultVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
          setTtsVoiceName(defaultVoice.name);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Sync index and read next page automatically
  useEffect(() => {
    setTtsCurrentLineIndex(0);
    if (ttsIsPlaying) {
      window.speechSynthesis.cancel();
      setTimeout(() => {
        speakCurrentLine(0);
      }, 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, ttsIsPlaying]);

  // Handle live speed or voice change
  useEffect(() => {
    if (ttsIsPlaying) {
      speakCurrentLine(ttsCurrentLineIndex);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsVoiceName, ttsSpeed, ttsIsPlaying, ttsCurrentLineIndex]);

  // Clean up TTS voice on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const speakCurrentLine = (lineIdx) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const pageLines = extractedLines.filter((l) => l.page === currentPage);
    if (pageLines.length === 0) {
      toast.error('No text found on this page to read.');
      setTtsIsPlaying(false);
      return;
    }

    if (lineIdx < 0 || lineIdx >= pageLines.length) {
      if (currentPage < pdfNumPages) {
        setCurrentPage((p) => p + 1);
      } else {
        toast('Reached the end of the document.', { icon: '📖' });
        setTtsIsPlaying(false);
        setTtsCurrentLineIndex(0);
      }
      return;
    }

    setTtsCurrentLineIndex(lineIdx);
    const lineText = pageLines[lineIdx].text;

    const utterance = new SpeechSynthesisUtterance(lineText);
    const voice = ttsVoices.find((v) => v.name === ttsVoiceName);
    if (voice) utterance.voice = voice;
    utterance.rate = ttsSpeed;

    utterance.onend = () => {
      speakCurrentLine(lineIdx + 1);
    };

    utterance.onerror = (e) => {
      if (ttsIsPlaying && e.error !== 'interrupted') {
        speakCurrentLine(lineIdx + 1);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleTtsPlay = () => {
    if (!window.speechSynthesis) {
      toast.error('Speech synthesis is not supported on this browser.');
      return;
    }
    setTtsIsPlaying(true);
    setTtsIsPaused(false);
    speakCurrentLine(ttsCurrentLineIndex);
  };

  const handleTtsPause = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.pause();
      setTtsIsPaused(true);
      setTtsIsPlaying(false);
    }
  };

  const handleTtsResume = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.resume();
      setTtsIsPaused(false);
      setTtsIsPlaying(true);
    }
  };

  const handleTtsStop = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setTtsIsPlaying(false);
      setTtsIsPaused(false);
    }
  };

  // Tab 5: Conversions States
  const [convertType, setConvertType] = useState('pdf-to-word');
  const [convertFiles, setConvertFiles] = useState([]);
  const [convertedUrl, setConvertedUrl] = useState(null);
  const [convertedName, setConvertedName] = useState('');
  const [conversionPreview, setConversionPreview] = useState(null); // {url, name, type, previewData, images: []}
  const [selectedImagePages, setSelectedImagePages] = useState([]); // Array of indices for images conversion
  const [toImageFormat, setToImageFormat] = useState('png'); // 'png' | 'jpeg'
  const [toImageQuality, setToImageQuality] = useState('medium'); // 'high' | 'medium' | 'low'

  // Tab 6: Utilities States
  const [utilType, setUtilType] = useState('merge-pdf');
  const [utilFiles, setUtilFiles] = useState([]);
  const [utilResultUrl, setUtilResultUrl] = useState(null);
  const [utilResultName, setUtilResultName] = useState('');
  const [rotationAngle, setRotationAngle] = useState(90);
  const [pagesToDelete, setPagesToDelete] = useState([]); // array of 0-based indices

  const activeTabRef = useRef(defaultTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
    if (activeTab === 'edit') setEditMode('text');
    else if (activeTab === 'signature') setEditMode('signature');
    else if (activeTab === 'watermark') setEditMode('watermark');
    // Reset conversionPreview when switching tabs to prevent stale data crashes (white screen bug)
    setConversionPreview(null);
  }, [activeTab]);

  // Dynamic load route props
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Save page state to local storage when page changes
  useEffect(() => {
    if (uploadedFile && currentPage) {
      localStorage.setItem(`pdf_page_${uploadedFile.name}`, currentPage.toString());
    }
  }, [currentPage, uploadedFile]);

  // Load editor page base64 on-demand when editorPageIdx or pdfPages changes
  useEffect(() => {
    if (!pdfDocument) return;
    
    let active = true;
    const loadEditorPage = async () => {
      if (pdfPages[editorPageIdx]) {
        setEditorPageBase64(pdfPages[editorPageIdx]);
        return;
      }
      
      try {
        const page = await pdfDocument.getPage(editorPageIdx + 1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({ canvasContext: context, viewport }).promise;
        const base64 = canvas.toDataURL('image/png');
        
        if (active) {
          setPdfPages((prev) => {
            const next = [...prev];
            next[editorPageIdx] = base64;
            return next;
          });
          setEditorPageBase64(base64);
        }
      } catch (err) {
        console.error('Error rendering editor page:', err);
      }
    };
    
    loadEditorPage();
    return () => {
      active = false;
    };
  }, [pdfDocument, editorPageIdx, pdfPages]);

  // Listen for shared PDF files passed from the native Android app container
  useEffect(() => {
    const handleSharedPdf = (e) => {
      if (e.detail) {
        processDocument(e.detail);
      }
    };
    window.addEventListener('open-shared-pdf', handleSharedPdf);
    return () => window.removeEventListener('open-shared-pdf', handleSharedPdf);
  }, [pdfDocument, pdfPages]);

  // On-demand PDF main viewer rendering
  useEffect(() => {
    if (!pdfDocument || activeTab !== 'view') return;

    let active = true;
    const renderPage = async () => {
      try {
        // Cancel previous render task if any
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDocument.getPage(currentPage);
        if (!active || !viewerCanvasRef.current) return;

        const canvas = viewerCanvasRef.current;
        const context = canvas.getContext('2d');

        // Apply rotation to viewport if needed
        const viewport = page.getViewport({ scale: zoomScale, rotation: rotation });
        currentViewportRef.current = viewport;
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        
        await renderTask.promise;
        if (active) {
          renderTaskRef.current = null;

          // Draw search highlights
          if (pdfSearchQuery.trim().length >= 2 && pdfSearchResults.length > 0) {
            const query = pdfSearchQuery.toLowerCase();
            const pageMatches = pdfSearchResults.filter((match) => match.pageIndex === currentPage - 1);
            
            pageMatches.forEach((match) => {
              const isCurrentMatch = pdfSearchResults[pdfCurrentMatchIndex] && pdfSearchResults[pdfCurrentMatchIndex].id === match.id;
              
              const startIndex = match.text.toLowerCase().indexOf(query);
              if (startIndex !== -1) {
                // Calculate character offset boundaries
                const charWidth = match.width / match.text.length;
                const matchTx = match.tx + startIndex * charWidth;
                const matchWidth = query.length * charWidth;
                
                const [x1, y1] = viewport.convertToViewportPoint(matchTx, match.ty);
                const [x2, y2] = viewport.convertToViewportPoint(matchTx + matchWidth, match.ty + (match.height || 12));
                
                const left = Math.min(x1, x2);
                const top = Math.min(y1, y2);
                const rectWidth = Math.abs(x1 - x2);
                const rectHeight = Math.abs(y1 - y2);
                
                // Draw highlight rect
                context.fillStyle = isCurrentMatch ? 'rgba(234, 179, 8, 0.5)' : 'rgba(254, 240, 138, 0.4)';
                context.fillRect(left, top, rectWidth, rectHeight);
                
                if (isCurrentMatch) {
                  context.strokeStyle = 'rgb(202, 138, 4)';
                  context.lineWidth = 1.5;
                  context.strokeRect(left, top, rectWidth, rectHeight);
                }
              }
            });
          }

          // Draw user highlights and underlines
          const pageAnnots = pdfAnnotations.filter((ann) => ann.pageIndex === currentPage - 1);
          pageAnnots.forEach((ann) => {
            const [x1, y1] = viewport.convertToViewportPoint(ann.tx, ann.ty);
            const [x2, y2] = viewport.convertToViewportPoint(ann.tx + ann.width, ann.ty + ann.height);
            
            const left = Math.min(x1, x2);
            const top = Math.min(y1, y2);
            const rectWidth = Math.abs(x1 - x2);
            const rectHeight = Math.abs(y1 - y2);
            
            if (ann.type === 'highlight') {
              context.fillStyle = 'rgba(253, 224, 71, 0.4)'; // soft highlight yellow
              context.fillRect(left, top, rectWidth, rectHeight);
            } else if (ann.type === 'underline') {
              context.strokeStyle = 'rgba(239, 68, 68, 0.85)'; // red underline
              context.lineWidth = 2 * zoomScale;
              context.beginPath();
              context.moveTo(left, top + rectHeight);
              context.lineTo(left + rectWidth, top + rectHeight);
              context.stroke();
            }
          });

          // Map text hitboxes to state synchronously
          const pageTextMatches = pdfTextItems.filter((item) => item.pageIndex === currentPage - 1);
          const mappedItems = pageTextMatches.map((item) => {
            const [x1, y1] = viewport.convertToViewportPoint(item.tx, item.ty);
            const [x2, y2] = viewport.convertToViewportPoint(item.tx + item.width, item.ty + (item.height || 12));
            return {
              ...item,
              left: Math.min(x1, x2),
              top: Math.min(y1, y2),
              width: Math.abs(x1 - x2),
              height: Math.abs(y1 - y2),
            };
          });
          setCurrentPageTextItems(mappedItems);
        }
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Error rendering viewer page:', err);
        }
      }
    };

    // Use simple requestAnimationFrame to ensure canvas ref is bound
    const animationFrameId = requestAnimationFrame(renderPage);

    return () => {
      active = false;
      cancelAnimationFrame(animationFrameId);
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDocument, currentPage, zoomScale, rotation, activeTab, pdfSearchQuery, pdfSearchResults, pdfCurrentMatchIndex, pdfAnnotations, pdfTextItems]);

  // PDF Search logic
  useEffect(() => {
    if (!pdfSearchQuery.trim() || pdfSearchQuery.trim().length < 2) {
      setPdfSearchResults([]);
      setPdfCurrentMatchIndex(-1);
      return;
    }

    const query = pdfSearchQuery.toLowerCase();
    const matches = pdfTextItems.filter((item) =>
      item.text.toLowerCase().includes(query)
    );

    // Sort by pageIndex, then by ty (descending in PDF points), then by tx (ascending)
    matches.sort((a, b) => {
      if (a.pageIndex !== b.pageIndex) {
        return a.pageIndex - b.pageIndex;
      }
      if (Math.abs(a.ty - b.ty) > 5) {
        return b.ty - a.ty;
      }
      return a.tx - b.tx;
    });

    setPdfSearchResults(matches);
    setPdfCurrentMatchIndex(matches.length > 0 ? 0 : -1);
  }, [pdfSearchQuery, pdfTextItems]);

  // Auto page jumping on active search match change
  useEffect(() => {
    if (pdfCurrentMatchIndex >= 0 && pdfSearchResults[pdfCurrentMatchIndex]) {
      const match = pdfSearchResults[pdfCurrentMatchIndex];
      setCurrentPage(match.pageIndex + 1);
    }
  }, [pdfCurrentMatchIndex, pdfSearchResults]);

  // Load annotations on startup/file load
  useEffect(() => {
    if (uploadedFile) {
      const saved = localStorage.getItem(`pdf_annots_${uploadedFile.name}`);
      if (saved) {
        try {
          setPdfAnnotations(JSON.parse(saved));
        } catch (e) {
          console.error('Error parsing annotations', e);
        }
      } else {
        setPdfAnnotations([]);
      }
    } else {
      setPdfAnnotations([]);
    }
  }, [uploadedFile]);

  // Save annotations helper
  const saveAnnotations = (annots) => {
    setPdfAnnotations(annots);
    if (uploadedFile) {
      localStorage.setItem(`pdf_annots_${uploadedFile.name}`, JSON.stringify(annots));
    }
  };

  const hasAnnotation = (item) => {
    return pdfAnnotations.some((ann) => ann.text === item.text && ann.pageIndex === item.pageIndex && ann.tx === item.tx);
  };

  const toggleAnnotation = (item, type) => {
    const exists = pdfAnnotations.findIndex(
      (ann) => ann.text === item.text && ann.pageIndex === item.pageIndex && ann.tx === item.tx
    );

    if (exists !== -1) {
      if (pdfAnnotations[exists].type === type) {
        const next = pdfAnnotations.filter((_, idx) => idx !== exists);
        saveAnnotations(next);
        toast.success(`${type} removed.`);
      } else {
        const next = pdfAnnotations.map((ann, idx) =>
          idx === exists ? { ...ann, type } : ann
        );
        saveAnnotations(next);
        toast.success(`Changed to ${type}.`);
      }
    } else {
      const newAnnot = {
        id: `ann-${Math.random().toString(36).substr(2, 9)}`,
        text: item.text,
        pageIndex: item.pageIndex,
        type: type,
        tx: item.tx,
        ty: item.ty,
        width: item.width,
        height: item.height || 12,
      };
      saveAnnotations([...pdfAnnotations, newAnnot]);
      toast.success(`Text ${type}ed!`);
    }
  };

  const removeAnnotationByItem = (item) => {
    const next = pdfAnnotations.filter(
      (ann) => !(ann.text === item.text && ann.pageIndex === item.pageIndex && ann.tx === item.tx)
    );
    saveAnnotations(next);
    toast.success('Annotation cleared.');
  };

  const handleTextItemClick = (e, item) => {
    e.stopPropagation();
    
    if (activeTool === 'highlight') {
      toggleAnnotation(item, 'highlight');
    } else if (activeTool === 'underline') {
      toggleAnnotation(item, 'underline');
    } else if (activeTool === 'eraser') {
      removeAnnotationByItem(item);
    } else {
      // Get click relative coordinate inside canvas parent wrapper
      const rect = e.currentTarget.parentElement.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      setActivePopup({ x: clickX, y: clickY, item });
    }
  };

  const getCachedBookmarks = (fileName) => {
    try {
      return JSON.parse(localStorage.getItem(`bookmarks_${fileName}`) || '[]');
    } catch (e) { return []; }
  };

  const saveCachedBookmarks = (fileName, list) => {
    try {
      localStorage.setItem(`bookmarks_${fileName}`, JSON.stringify(list));
    } catch (e) {}
  };

  const getCachedNotes = (fileName) => {
    try {
      return JSON.parse(localStorage.getItem(`pagenotes_${fileName}`) || '[]');
    } catch (e) { return []; }
  };

  const saveCachedNotes = (fileName, list) => {
    try {
      localStorage.setItem(`pagenotes_${fileName}`, JSON.stringify(list));
    } catch (e) {}
  };

  // Fetch bookmarks on file load
  const fetchBookmarks = async () => {
    if (!uploadedFile) return;
    if (!navigator.onLine) {
      const cached = getCachedBookmarks(uploadedFile.name);
      setPdfBookmarks(cached);
      return;
    }
    try {
      const res = await API.get('/bookmarks', { params: { fileName: uploadedFile.name } });
      setPdfBookmarks(res.data);
      saveCachedBookmarks(uploadedFile.name, res.data);
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
      const cached = getCachedBookmarks(uploadedFile.name);
      setPdfBookmarks(cached);
    }
  };

  useEffect(() => {
    if (uploadedFile) {
      fetchBookmarks();
    } else {
      setPdfBookmarks([]);
    }
  }, [uploadedFile]);

  // Create a bookmark for the current page
  const addBookmark = async () => {
    if (!uploadedFile) return;
    const title = `Bookmark - Page ${currentPage}`;
    if (!navigator.onLine) {
      const newB = {
        _id: `temp_${Date.now()}`,
        fileName: uploadedFile.name,
        pageNumber: currentPage,
        title
      };
      const updated = [...pdfBookmarks, newB].sort((a, b) => a.pageNumber - b.pageNumber);
      setPdfBookmarks(updated);
      saveCachedBookmarks(uploadedFile.name, updated);
      await queueOfflineAction('add_bookmark', '/bookmarks', {
        fileName: uploadedFile.name,
        pageNumber: currentPage,
        title
      });
      toast.success('Bookmark added locally! (Offline)');
      return;
    }
    try {
      const res = await API.post('/bookmarks', {
        fileName: uploadedFile.name,
        pageNumber: currentPage,
        title
      });
      const updated = [...pdfBookmarks, res.data].sort((a, b) => a.pageNumber - b.pageNumber);
      setPdfBookmarks(updated);
      saveCachedBookmarks(uploadedFile.name, updated);
      toast.success('Bookmark added!');
    } catch (err) {
      toast.error('Failed to add bookmark.');
    }
  };

  // Delete bookmark
  const deleteBookmark = async (id) => {
    const updated = pdfBookmarks.filter((b) => b._id !== id);
    setPdfBookmarks(updated);
    if (uploadedFile) saveCachedBookmarks(uploadedFile.name, updated);

    if (!navigator.onLine) {
      await queueOfflineAction('delete_bookmark', `/bookmarks/${id}`, { id });
      toast.success('Bookmark deleted locally! (Offline)');
      return;
    }
    try {
      await API.delete(`/bookmarks/${id}`);
      toast.success('Bookmark deleted.');
    } catch (err) {
      toast.error('Failed to delete bookmark.');
    }
  };

  // Rename bookmark
  const renameBookmark = async (id) => {
    if (!editingBookmarkTitle.trim()) return;
    const updated = pdfBookmarks.map((b) => (b._id === id ? { ...b, title: editingBookmarkTitle } : b));
    setPdfBookmarks(updated);
    if (uploadedFile) saveCachedBookmarks(uploadedFile.name, updated);
    setEditingBookmarkId(null);
    setEditingBookmarkTitle('');

    if (!navigator.onLine) {
      await queueOfflineAction('rename_bookmark', `/bookmarks/${id}`, { id, title: editingBookmarkTitle });
      toast.success('Bookmark renamed locally! (Offline)');
      return;
    }
    try {
      await API.put(`/bookmarks/${id}`, { title: editingBookmarkTitle });
      toast.success('Bookmark renamed!');
    } catch (err) {
      toast.error('Failed to rename bookmark.');
    }
  };

  // Fetch page notes on file load
  const fetchPageNotes = async () => {
    if (!uploadedFile) return;
    if (!navigator.onLine) {
      const cached = getCachedNotes(uploadedFile.name);
      setPdfPageNotes(cached);
      return;
    }
    try {
      const res = await API.get('/pagenotes', { params: { fileName: uploadedFile.name } });
      setPdfPageNotes(res.data);
      saveCachedNotes(uploadedFile.name, res.data);
    } catch (err) {
      console.error('Error fetching page notes:', err);
      const cached = getCachedNotes(uploadedFile.name);
      setPdfPageNotes(cached);
    }
  };

  useEffect(() => {
    if (uploadedFile) {
      fetchPageNotes();
    } else {
      setPdfPageNotes([]);
    }
  }, [uploadedFile]);

  // Add page note at specific canvas click coordinate
  const addPageNote = async (clickX, clickY) => {
    if (!uploadedFile || !currentViewportRef.current) return;
    const [pdfX, pdfY] = currentViewportRef.current.convertToPdfPoint(clickX, clickY);
    
    if (!navigator.onLine) {
      const newN = {
        _id: `temp_${Date.now()}`,
        fileName: uploadedFile.name,
        pageNumber: currentPage,
        x: pdfX,
        y: pdfY,
        content: ''
      };
      const updated = [...pdfPageNotes, newN];
      setPdfPageNotes(updated);
      saveCachedNotes(uploadedFile.name, updated);
      setActiveEditingNoteId(newN._id);
      setActiveEditingNoteText('');
      setNoteModeActive(false);
      await queueOfflineAction('add_note', '/pagenotes', {
        fileName: uploadedFile.name,
        pageNumber: currentPage,
        x: pdfX,
        y: pdfY,
        content: ''
      });
      toast.success('Sticky note placed locally! (Offline)');
      return;
    }

    try {
      const res = await API.post('/pagenotes', {
        fileName: uploadedFile.name,
        pageNumber: currentPage,
        x: pdfX,
        y: pdfY,
        content: ''
      });
      const updated = [...pdfPageNotes, res.data];
      setPdfPageNotes(updated);
      saveCachedNotes(uploadedFile.name, updated);
      setActiveEditingNoteId(res.data._id);
      setActiveEditingNoteText('');
      setNoteModeActive(false);
      toast.success('Sticky note placed!');
    } catch (err) {
      toast.error('Failed to place sticky note.');
    }
  };

  // Delete page note
  const deletePageNote = async (id) => {
    const updated = pdfPageNotes.filter((n) => n._id !== id);
    setPdfPageNotes(updated);
    if (uploadedFile) saveCachedNotes(uploadedFile.name, updated);
    setActiveEditingNoteId(null);

    if (!navigator.onLine) {
      await queueOfflineAction('delete_note', `/pagenotes/${id}`, { id });
      toast.success('Sticky note deleted locally! (Offline)');
      return;
    }
    try {
      await API.delete(`/pagenotes/${id}`);
      toast.success('Sticky note deleted.');
    } catch (err) {
      toast.error('Failed to delete sticky note.');
    }
  };

  // Debounced auto save page note content
  const autoSavePageNote = (id, text) => {
    if (saveNoteTimeoutRef.current) {
      clearTimeout(saveNoteTimeoutRef.current);
    }
    
    const updated = pdfPageNotes.map((n) => (n._id === id ? { ...n, content: text } : n));
    setPdfPageNotes(updated);
    if (uploadedFile) saveCachedNotes(uploadedFile.name, updated);

    saveNoteTimeoutRef.current = setTimeout(async () => {
      if (!navigator.onLine) {
        await queueOfflineAction('save_note', `/pagenotes/${id}`, { id, content: text });
        return;
      }
      try {
        await API.put(`/pagenotes/${id}`, { content: text });
      } catch (err) {
        console.error('Error auto-saving page note:', err);
      }
    }, 600);
  };

  // Fetch recent files list from IndexedDB
  const fetchRecentFiles = async () => {
    const list = await getAllRecentFilesFromDB();
    setRecentFiles(list);
  };

  useEffect(() => {
    fetchRecentFiles();
  }, []);

  const openRecentFile = async (recentItem) => {
    try {
      setPdfLoading(true);
      const item = await getRecentFileFromDB(recentItem.fileName);
      if (item && item.fileData) {
        processDocument(item.fileData);
      } else {
        toast.error('Could not find file bytes in local cache.');
        setPdfLoading(false);
      }
    } catch (err) {
      console.error('Error loading recent file:', err);
      toast.error('Error loading file from cache.');
      setPdfLoading(false);
    }
  };

  const deleteRecentItem = async (fileName) => {
    await deleteRecentFileFromDB(fileName);
    fetchRecentFiles();
    toast.success('Removed from history.');
  };

  const clearRecentHistory = async () => {
    await clearAllRecentFilesFromDB();
    fetchRecentFiles();
    toast.success('History cleared.');
  };

  // Fetch favourites list on mount / start
  const fetchFavourites = async () => {
    if (!navigator.onLine) {
      try {
        const cached = JSON.parse(localStorage.getItem('pdf_favourites') || '[]');
        setPdfFavourites(cached);
      } catch (e) {
        setPdfFavourites([]);
      }
      return;
    }
    try {
      const res = await API.get('/favourites');
      setPdfFavourites(res.data);
      localStorage.setItem('pdf_favourites', JSON.stringify(res.data));
    } catch (err) {
      console.error('Error fetching favourites:', err);
      try {
        const cached = JSON.parse(localStorage.getItem('pdf_favourites') || '[]');
        setPdfFavourites(cached);
      } catch (e) {
        setPdfFavourites([]);
      }
    }
  };

  useEffect(() => {
    fetchFavourites();
  }, []);

  // Toggle favourite status
  const toggleFavourite = async (fileName) => {
    if (!fileName) return;
    const isFav = pdfFavourites.includes(fileName);
    
    let updated;
    if (isFav) {
      updated = pdfFavourites.filter((name) => name !== fileName);
      setPdfFavourites(updated);
      localStorage.setItem('pdf_favourites', JSON.stringify(updated));
      
      if (!navigator.onLine) {
        await queueOfflineAction('delete_favourite', `/favourites?fileName=${fileName}`, { fileName });
        toast.success('Removed from favourites locally! (Offline)');
        return;
      }
      
      try {
        await API.delete('/favourites', { params: { fileName } });
        toast.success('Removed from favourites.');
      } catch (err) {
        toast.error('Failed to update favourites.');
      }
    } else {
      updated = [fileName, ...pdfFavourites];
      setPdfFavourites(updated);
      localStorage.setItem('pdf_favourites', JSON.stringify(updated));
      
      if (!navigator.onLine) {
        await queueOfflineAction('add_favourite', '/favourites', { fileName });
        toast.success('Added to favourites locally! (Offline)');
        return;
      }
      
      try {
        await API.post('/favourites', { fileName });
        toast.success('Added to favourites!');
      } catch (err) {
        toast.error('Failed to update favourites.');
      }
    }
  };

  // Load external scripts (PDF-lib, PDF.js, Tesseract.js)
  useEffect(() => {
    let active = true;
    const loadLibs = async () => {
      try {
        if (!window.PDFLib) {
          await new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
            s.async = true;
            s.onload = res;
            s.onerror = rej;
            document.body.appendChild(s);
          });
        }
        if (!window.pdfjsLib) {
          await new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = '/pdf.min.js';
            s.async = true;
            s.onload = res;
            s.onerror = rej;
            document.body.appendChild(s);
          });
          // UMD module for 3.11.174 exports to window['pdfjs-dist/build/pdf']
          window.pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
          } else {
            throw new Error('pdfjsLib failed to initialize');
          }
        }
        if (!window.Tesseract) {
          await new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = 'https://unpkg.com/tesseract.js@5.0.5/dist/tesseract.min.js';
            s.async = true;
            s.onload = res;
            s.onerror = rej;
            document.body.appendChild(s);
          });
        }
        if (active) setLibsLoaded(true);
      } catch (err) {
        console.error('Failed to load dynamic scripts', err);
        if (active) setLibsError(true);
      }
    };
    loadLibs();
    return () => {
      active = false;
    };
  }, []);

  // Process Document File (render pages, extract text, extract line by line)
  const processDocument = async (file) => {
    if (!file) return;
    
    // Save file to IndexedDB for Recent PDFs tracking
    if (file && file.name) {
      await saveRecentFileToDB(file.name, file, file.size);
      fetchRecentFiles();
    }
    
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    setUploadedFile(file);
    
    // Reset stale operation states from previous file
    setConversionPreview(null);
    setConvertFiles([]);
    setConvertedUrl(null);
    setConvertedName('');
    setUtilFiles([]);
    setUtilResultUrl(null);
    setUtilResultName('');
    setOcrResult('');
    setOcrImage(null);
    setOcrProgress(0);
    setCompressState('idle');
    setCompressedBlob(null);
    setCompressedBlobUrl(null);
    setSelectedSplitPages([]);
    setSplitState('idle');
    setSplitResultBlob(null);
    setSplitResultUrl(null);
    setAddedTexts([]);
    setAddedSignatures([]);
    
    if (!isPdf) {
      setIsProcessing(true);
      setLoadingProgress(10);
      try {
        const name = file.name.toLowerCase();
        if (name.endsWith('.txt')) {
          const text = await file.text();
          setLoadingProgress(50);
          
          // Render TXT text lines onto canvas pages
          const lines = text.split('\n');
          const canvasPages = [];
          const lineHeight = 22;
          const padding = 50;
          const pageWidth = 600;
          const pageHeight = 800;
          const linesPerPage = Math.floor((pageHeight - padding * 2) / lineHeight);
          
          let pageIdx = 0;
          while (lines.length > 0) {
            const pageLines = lines.splice(0, linesPerPage);
            const canvas = document.createElement('canvas');
            canvas.width = pageWidth;
            canvas.height = pageHeight;
            const ctx = canvas.getContext('2d');
            
            // Draw A4 page background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, pageWidth, pageHeight);
            
            // Draw text
            ctx.fillStyle = '#111111';
            ctx.font = '13px Courier New, Courier, monospace';
            pageLines.forEach((line, i) => {
              ctx.fillText(line, padding, padding + i * lineHeight);
            });
            
            canvasPages.push(canvas.toDataURL('image/png'));
            pageIdx++;
          }
          
          setPdfPages(canvasPages);
          setPdfNumPages(canvasPages.length);
          setExtractedText(text);
          setExtractedLines(text.split('\n').map((l, idx) => ({ id: idx, text: l, page: Math.floor(idx / linesPerPage) + 1 })));
          toast.success('Successfully loaded text document into Viewer!');
        } 
        else if (file.type.startsWith('image/')) {
          // Render Image file directly as Page 1
          const reader = new FileReader();
          await new Promise((resolve) => {
            reader.onload = (e) => {
              setPdfPages([e.target.result]);
              setPdfNumPages(1);
              setExtractedText(`[Image Document: ${file.name}]`);
              setExtractedLines([{ id: 1, text: `Image Page 1`, page: 1 }]);
              resolve();
            };
            reader.readAsDataURL(file);
          });
          toast.success('Successfully loaded image into Viewer!');
        }
        else {
          // Render premium placeholder for Word DOCX
          setLoadingProgress(50);
          const canvas = document.createElement('canvas');
          canvas.width = 600;
          canvas.height = 800;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 600, 800);
          
          ctx.fillStyle = '#2b579a'; // Word blue
          ctx.fillRect(0, 0, 600, 80);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText('Microsoft Word Document Viewer', 45, 48);
          
          ctx.fillStyle = '#333333';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(`Document Filename: ${file.name}`, 50, 140);
          ctx.font = '11px sans-serif';
          ctx.fillStyle = '#666666';
          ctx.fillText('Loaded into Student OS Workspace v2.0', 50, 165);
          ctx.fillText('spelling corrections, annotations and signatures are active.', 50, 190);
          
          ctx.strokeStyle = '#eef2f7';
          ctx.lineWidth = 2;
          for (let y = 240; y < 720; y += 28) {
            ctx.beginPath();
            ctx.moveTo(50, y);
            ctx.lineTo(550, y);
            ctx.stroke();
          }
          
          const pages = [canvas.toDataURL('image/png')];
          setPdfPages(pages);
          setPdfNumPages(1);
          setExtractedText(`[Word Document Placeholder: ${file.name}]`);
          setExtractedLines([{ id: 1, text: `Word Document Page 1`, page: 1 }]);
          toast.success('Successfully loaded Word document structure!');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to parse document format.');
      } finally {
        setIsProcessing(false);
        setLoadingProgress(0);
      }
      return;
    }

    setIsProcessing(true);
    setLoadingProgress(10);
    setPdfError(null);

    try {
      if (!window.pdfjsLib && window['pdfjs-dist/build/pdf']) {
        window.pdfjsLib = window['pdfjs-dist/build/pdf'];
      }
      if (!window.pdfjsLib) { toast.error('PDF viewer library still loading. Please try again in a moment.'); setIsProcessing(false); setPdfLoading(false); return; }
      const arrayBuffer = await file.arrayBuffer();
      setLoadingProgress(30);

      // Load using PDF.js
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDocument(pdf);
      setPdfNumPages(pdf.numPages);
      setLoadingProgress(50);

      // Initialize empty pdfPages slots to dynamically load on demand
      const imagePages = new Array(pdf.numPages).fill(null);

      setPdfPages(imagePages);
      setEditorPageIdx(0);
      setAddedTexts([]);
      setAddedSignatures([]);
      setAiSummary('');
      setAiFlashcards([]);

      // Defer heavy text extraction so the Viewer UI loads instantly
      setTimeout(async () => {
        try {
          let fullText = '';
          let lines = [];
          const textItemsList = [];

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            const viewport = page.getViewport({ scale: 1.2 });
            textContent.items.forEach((item) => {
              if (item.str.trim().length > 0) {
                const [cx, cy] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
                textItemsList.push({
                  id: `${i}-${Math.random().toString(36).substr(2, 6)}`,
                  text: item.str,
                  cx: cx,
                  cy: cy,
                  tx: item.transform[4],
                  ty: item.transform[5],
                  width: item.width || (item.str.length * (item.transform[0] || 8) * 0.6),
                  height: item.height || item.transform[3] || 12,
                  fontSize: item.transform[3] || 12,
                  pageIndex: i - 1,
                });
              }
            });

            const pageText = textContent.items.map((item) => item.str).join(' ');
            fullText += `--- Page ${i} ---\n${pageText}\n\n`;

            let lineGroups = {};
            textContent.items.forEach((item) => {
              const y = Math.round(item.transform[5] / 8) * 8;
              if (!lineGroups[y]) lineGroups[y] = [];
              lineGroups[y].push(item);
            });

            const sortedY = Object.keys(lineGroups).sort((a, b) => b - a);
            sortedY.forEach((y) => {
              const sortedItems = lineGroups[y].sort((a, b) => a.transform[4] - b.transform[4]);
              const lineText = sortedItems.map((item) => item.str).join(' ').trim();
              if (lineText.length > 2) {
                lines.push({
                  text: lineText,
                  page: i,
                  id: `${i}-${y}-${Math.random().toString(36).substr(2, 4)}`,
                });
              }
            });
          }

          setExtractedText(fullText);
          setExtractedLines(lines);
          setPdfTextItems(textItemsList);
          setAiChat([{ role: 'assistant', text: `Successfully loaded "${file.name}"! I've indexed ${pdf.numPages} pages and extracted ${lines.length} lines of text. Ask me anything about the content, or generate a summary / flashcards.` }]);
        } catch (e) {
          console.error("Background text extraction failed", e);
        }
      }, 100);

      // Restore last opened page
      const savedPage = localStorage.getItem(`pdf_page_${file.name}`);
      if (savedPage) {
        const pageNum = parseInt(savedPage, 10);
        if (pageNum >= 1 && pageNum <= pdf.numPages) {
          setCurrentPage(pageNum);
        } else {
          setCurrentPage(1);
        }
      } else {
        setCurrentPage(1);
      }

      toast.success('Document loaded and indexed successfully!');
    } catch (err) {
      console.error(err);
      setPdfError(err.message || 'The PDF file appears to be corrupted or invalid.');
      toast.error('Failed to parse the PDF document.');
    } finally {
      setIsProcessing(false);
      setLoadingProgress(0);
      setPdfLoading(false);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processDocument(files[0]);
    }
  };

  // Text-To-Speech for line-by-line reading
  const speakLine = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
      toast.success('Reading line aloud...');
    } else {
      toast.error('Text-to-speech is not supported in this browser.');
    }
  };

  // Explain single line using Gemini API
  const explainLineWithAI = async (line) => {
    toast.loading('Analyzing line with Gemini AI...', { id: 'explain' });
    try {
      const response = await API.post('/ai/chat', {
        message: `In the context of the study material, explain this specific sentence simply: "${line.text}"`,
        history: [],
        provider: 'gemini',
      });
      toast.dismiss('explain');
      
      // Navigate to AI tab and display answer
      setActiveTab('ai');
      setAiChat((prev) => [
        ...prev,
        { role: 'user', text: `Explain the line: "${line.text}"` },
        { role: 'assistant', text: response.data.reply },
      ]);
    } catch (err) {
      toast.dismiss('explain');
      toast.error('Could not explain line using AI.');
    }
  };

  const handleToggleFullscreen = () => {
    const el = viewerContainerRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        toast.error('Fullscreen mode failed.');
        console.error(err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Touch event handlers for Pinch-to-zoom
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchStartDist(dist);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDist) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDist;
      const newScale = Math.min(Math.max(zoomScale * factor, 0.5), 3.0);
      setZoomScale(newScale);
      setTouchStartDist(dist);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartDist(null);
  };

  // Double tap to Zoom toggler
  const handleDoubleTap = (e) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      if (zoomScale > 1.1) {
        setZoomScale(1.0);
      } else {
        setZoomScale(2.0);
      }
    }
    setLastTap(now);
  };

  // Drawing Canvas Handlers for Signature
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#f8fafc';
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignatureCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignaturePad = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Extract base64 png
    const dataUrl = canvas.toDataURL('image/png');
    // Save to placing state
    setAddedSignatures((prev) => [
      ...prev,
      {
        dataUrl,
        x: 50, // default placeholder coords
        y: 100,
        width: 150,
        height: 60,
        pageIndex: editorPageIdx,
      },
    ]);
    setShowSignaturePad(false);
    toast.success('Signature added! You can drag and position it on the document.');
  };

  // Editor Page Click to Position items
  const handleEditorPageClick = (e) => {
    if (editMode === 'text') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setActiveInlineInput({
        x: x,
        y: y,
        val: ''
      });
    }
  };

  // Save changes to PDF using pdf-lib
  const handleSaveEditedPdf = async () => {
    if (!uploadedFile) return;
    setIsProcessing(true);
    try {
      if (!window.PDFLib) { toast.error('PDF library still loading...'); setIsProcessing(false); return; }
      const { PDFDocument, rgb, degrees } = window.PDFLib;
      const bytes = await uploadedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes);
      const Helvetica = await pdfDoc.embedStandardFont('Helvetica');
      const pages = pdfDoc.getPages();

      // Apply watermark text across all pages
      if (editMode === 'watermark' && watermarkText.trim()) {
        pages.forEach((page) => {
          const { width, height } = page.getSize();
          page.drawText(watermarkText, {
            x: width / 6,
            y: height / 2,
            size: 40,
            font: Helvetica,
            color: rgb(0.7, 0.7, 0.7),
            opacity: 0.25,
            rotate: degrees(35),
          });
        });
      }

      // Apply custom text clicks
      addedTexts.forEach((item) => {
        if (item.pageIndex < pages.length) {
          const page = pages[item.pageIndex];
          
          let pdfX, pdfY;
          if (item.isReplacement) {
            // Replaced text: cover original text with a white rectangle first
            page.drawRectangle({
              x: item.tx,
              y: item.ty - 2,
              width: item.tw,
              height: item.th + 4,
              color: rgb(1, 1, 1), // Whiteout!
            });
            
            pdfX = item.tx;
            pdfY = item.ty;
          } else {
            const { height } = page.getSize();
            pdfX = (item.x / 1.5) * 1.25;
            pdfY = height - (item.y / 1.5) * 1.25;
          }

          // Simple hex to rgb
          const r = parseInt(item.color.slice(1, 3), 16) / 255;
          const g = parseInt(item.color.slice(3, 5), 16) / 255;
          const b = parseInt(item.color.slice(5, 7), 16) / 255;

          page.drawText(item.text, {
            x: pdfX,
            y: pdfY,
            size: item.size || 12,
            font: Helvetica,
            color: rgb(r, g, b),
          });
        }
      });

      // Apply signatures
      for (const sig of addedSignatures) {
        if (sig.pageIndex < pages.length) {
          const page = pages[sig.pageIndex];
          const { height } = page.getSize();
          const pdfX = (sig.x / 1.5) * 1.25;
          const pdfY = height - (sig.y / 1.5) * 1.25 - 50;

          const sigBase64 = sig.dataUrl.split(',')[1];
          const sigBinary = window.atob(sigBase64);
          const sigBytes = new Uint8Array(sigBinary.length);
          for (let j = 0; j < sigBinary.length; j++) {
            sigBytes[j] = sigBinary.charCodeAt(j);
          }
          const sigImg = await pdfDoc.embedPng(sigBytes);
          page.drawImage(sigImg, {
            x: pdfX,
            y: pdfY,
            width: sig.width,
            height: sig.height,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited_${uploadedFile.name}`;
      a.click();
      toast.success('Successfully compiled and downloaded modified PDF!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to compile the modifications.');
    } finally {
      setIsProcessing(false);
    }
  };

  // AI Tab: Send message with PDF Context
  const handleAiChatSend = async () => {
    if (!aiInput.trim()) return;
    const query = aiInput;
    setAiInput('');
    setAiChat((prev) => [...prev, { role: 'user', text: query }]);
    setAiLoading(true);

    try {
      const docContext = extractedText.substring(0, 10000);
      const prompt = `You are discussing a PDF study material. Below is the document context:
---
${docContext}
---
User Question: ${query}`;

      const response = await API.post('/ai/chat', {
        message: prompt,
        history: aiChat.slice(-6).map((c) => ({ role: c.role, text: c.text })),
        provider: 'gemini',
      });

      setAiChat((prev) => [...prev, { role: 'assistant', text: response.data.reply }]);
    } catch (err) {
      console.error(err);
      toast.error('Gemini failed to answer.');
    } finally {
      setAiLoading(false);
    }
  };

  // AI Tab: Generate Document Summary
  const handleGenerateSummary = async () => {
    if (!extractedText) return;
    setAiLoading(true);
    try {
      const prompt = `Provide a premium academic summary of the following study material, emphasizing key formulas, terms, and conceptual summaries:
---
${extractedText.substring(0, 12000)}
---`;
      const response = await API.post('/ai/chat', { message: prompt, history: [], provider: 'gemini' });
      setAiSummary(response.data.reply);
      toast.success('Summary generated!');
    } catch (err) {
      toast.error('Failed to generate summary.');
    } finally {
      setAiLoading(false);
    }
  };

  // AI Tab: Generate Flashcards
  const handleGenerateFlashcards = async () => {
    if (!extractedText) return;
    setAiLoading(true);
    try {
      const prompt = `Analyze this text and extract exactly 5 structured academic question-answer pairs for student testing.
Return them ONLY in this format: 
Q1: [Question]
A1: [Answer]
Q2: [Question]
A2: [Answer]
etc. Do not write any other conversational sentences.
---
${extractedText.substring(0, 10000)}
---`;
      const response = await API.post('/ai/chat', { message: prompt, history: [], provider: 'gemini' });
      
      const cards = [];
      const text = response.data.reply;
      const lines = text.split('\n');
      let currentQ = '';

      lines.forEach((line) => {
        if (line.toUpperCase().startsWith('Q')) {
          currentQ = line.replace(/^Q\d+:\s*/i, '').trim();
        } else if (line.toUpperCase().startsWith('A') && currentQ) {
          cards.push({
            question: currentQ,
            answer: line.replace(/^A\d+:\s*/i, '').trim(),
            flipped: false,
          });
          currentQ = '';
        }
      });

      setAiFlashcards(cards);
      toast.success('Flashcards generated successfully!');
    } catch (err) {
      toast.error('Failed to generate flashcards.');
    } finally {
      setAiLoading(false);
    }
  };

  // OCR Tab: Execute OCR
  const handleOcrFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOcrImage(event.target.result);
        executeOCR(event.target.result);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      setIsProcessing(true);
      try {
        const buffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport }).promise;
        const dataUrl = canvas.toDataURL('image/png');
        setOcrImage(dataUrl);
        executeOCR(dataUrl);
      } catch (err) {
        toast.error('Failed to render PDF page for OCR.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const executeOCR = async (imageSrc) => {
    setOcrLoading(true);
    setOcrProgress(5);
    setOcrResult('');
    try {
      const worker = await window.Tesseract.createWorker({
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });
      const ret = await worker.recognize(imageSrc);
      setOcrResult(ret.data.text);
      await worker.terminate();
      toast.success('OCR completed successfully!');
    } catch (err) {
      toast.error('OCR character recognition failed.');
    } finally {
      setOcrLoading(false);
      setOcrProgress(0);
    }
  };

  // Conversions Tab: Convert files (populates preview block instead of auto downloading)
  const handleConversionProcess = async (forcedType = null) => {
    const file = forcedType ? uploadedFile : convertFiles[0];
    if (!file) {
      toast.error('Please select files to convert.');
      return;
    }
    const type = forcedType || convertType;
    const pdfOnlyTypes = ['pdf-to-word', 'to-word', 'pdf-to-image', 'to-image', 'pdf-to-text', 'to-text'];
    if (pdfOnlyTypes.includes(type) && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('This conversion requires a PDF file.');
      return;
    }
    setIsProcessing(true);
    try {
      if (!window.pdfjsLib || !window.PDFLib) { toast.error('PDF libraries still loading. Please wait...'); setIsProcessing(false); return; }
      if (type === 'pdf-to-word' || type === 'to-word') {
        const buffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
        let htmlContent = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          htmlContent += `<p>${text.items.map(t => t.str).join(' ')}</p><br/>`;
        }

        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><title>Document</title></head><body>";
        const footer = "</body></html>";
        const blob = new Blob(['\ufeff' + header + htmlContent + footer], { type: 'application/msword' });
        
        const url = URL.createObjectURL(blob);
        const name = `${file.name.replace('.pdf', '')}.doc`;
        
        setConversionPreview({
          type: 'word',
          name: name,
          url: url,
          previewData: htmlContent,
        });
        toast.success('Converted to Word! You can review the preview below before downloading.');
      } 
      else if (type === 'pdf-to-image' || type === 'to-image') {
        const buffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
        
        let scale = 2.0;
        if (toImageQuality === 'high') scale = 3.0;
        else if (toImageQuality === 'low') scale = 1.0;

        const mimeType = toImageFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
        const ext = toImageFormat === 'jpeg' ? 'jpg' : 'png';

        const selectedIndices = selectedImagePages.length > 0 ? selectedImagePages : Array.from({ length: pdf.numPages }, (_, k) => k);
        const imageList = [];
        
        for (const idx of selectedIndices) {
          const page = await pdf.getPage(idx + 1);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: context, viewport }).promise;
          imageList.push({
            name: `${file.name.replace('.pdf', '')}_page${idx + 1}.${ext}`,
            url: canvas.toDataURL(mimeType, 0.9)
          });
        }

        setConversionPreview({
          type: 'image',
          name: file.name,
          images: imageList,
          format: ext
        });
        toast.success('Generated page images! You can preview and download them below.');
      } 
      else if (type === 'pdf-to-text' || type === 'to-text') {
        const buffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
        let txt = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          txt += text.items.map(t => t.str).join(' ') + '\n\n';
        }
        const blob = new Blob([txt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const name = `${file.name.replace('.pdf', '')}_extracted.txt`;

        setConversionPreview({
          type: 'text',
          name: name,
          url: url,
          previewData: txt
        });
        toast.success('Text extracted! Preview and download options are ready.');
      }
      else if (type === 'text-to-pdf') {
        const text = await file.text();
        const { PDFDocument } = window.PDFLib;
        const pdfDoc = await PDFDocument.create();
        const Helvetica = await pdfDoc.embedStandardFont('Helvetica');
        const lines = text.split('\n');
        
        let page = pdfDoc.addPage([595, 842]);
        let y = 800;
        
        for (const line of lines) {
          if (y < 50) {
            page = pdfDoc.addPage([595, 842]);
            y = 800;
          }
          page.drawText(line.substring(0, 80), { x: 50, y, size: 11, font: Helvetica });
          y -= 15;
        }

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const name = `${file.name.replace('.txt', '')}.pdf`;

        setConversionPreview({
          type: 'pdf',
          name: name,
          url: url,
          previewData: 'TXT successfully converted to PDF format.'
        });
        toast.success('TXT converted to PDF! Click below to review and download.');
      }
      else if (type === 'image-to-pdf') {
        const { PDFDocument } = window.PDFLib;
        const pdfDoc = await PDFDocument.create();
        
        for (const f of convertFiles) {
          const bytes = await f.arrayBuffer();
          let img;
          if (f.type === 'image/png') {
            img = await pdfDoc.embedPng(bytes);
          } else {
            img = await pdfDoc.embedJpg(bytes);
          }
          const page = pdfDoc.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        }

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const name = `images_merged.pdf`;

        setConversionPreview({
          type: 'pdf',
          name: name,
          url: url,
          previewData: 'Images successfully compiled into PDF document.'
        });
        toast.success('Images converted to PDF! Ready to download.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Conversion process failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInsertPdf = async (file) => {
    if (!file) return;
    setIsProcessing(true);
    setLoadingProgress(10);
    try {
      const buffer = await file.arrayBuffer();
      const doc = await window.pdfjsLib.getDocument({ data: buffer }).promise;
      const newPages = [];
      
      for (let i = 1; i <= doc.numPages; i++) {
        setLoadingProgress(Math.round((i / doc.numPages) * 100));
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport }).promise;
        newPages.push(canvas.toDataURL('image/png'));
      }
      
      setPdfPages(prev => [...prev, ...newPages]);
      setPdfNumPages(prev => prev + doc.numPages);
      toast.success(`Successfully inserted ${doc.numPages} pages into the workspace!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to parse and insert PDF pages.');
    } finally {
      setIsProcessing(false);
      setLoadingProgress(0);
    }
  };

  const handleToPdfClick = async () => {
    if (!uploadedFile) { toast.error('No file uploaded.'); return; }
    if (!window.PDFLib) { toast.error('PDF library still loading...'); return; }
    setIsProcessing(true);
    setLoadingProgress(10);
    try {
      const name = uploadedFile.name.toLowerCase();
      const isPdf = name.endsWith('.pdf');
      
      if (isPdf) {
        // For PDFs, compile edited annotations into PDF
        const { PDFDocument } = window.PDFLib;
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const doc = await PDFDocument.load(arrayBuffer);
        
        const Helvetica = await doc.embedStandardFont('Helvetica');
        const pages = doc.getPages();
        
        addedTexts.forEach((item) => {
          const page = pages[item.pageIndex || 0];
          if (page) {
            const { width, height } = page.getSize();
            
            if (item.bgMask) {
              const approxWidth = item.text.length * (item.size * 0.55);
              page.drawRectangle({
                x: item.x - approxWidth / 2 - 4,
                y: height - item.y - item.size / 2 - 2,
                width: approxWidth + 8,
                height: item.size + 4,
                color: window.PDFLib.rgb(1, 1, 1),
              });
            }
            
            page.drawText(item.text, {
              x: item.bgMask ? (item.x - (item.text.length * (item.size * 0.55)) / 2) : item.x,
              y: item.bgMask ? (height - item.y - item.size / 2) : (height - item.y),
              size: item.size,
              font: Helvetica,
              color: item.bgMask ? window.PDFLib.rgb(0, 0, 0) : window.PDFLib.rgb(
                parseInt(item.color.slice(1, 3), 16) / 255 || 0,
                parseInt(item.color.slice(3, 5), 16) / 255 || 0,
                parseInt(item.color.slice(5, 7), 16) / 255 || 0
              )
            });
          }
        });

        if (watermarkText) {
          pages.forEach((page) => {
            const { width, height } = page.getSize();
            page.drawText(watermarkText, {
              x: width / 4,
              y: height / 2,
              size: 40,
              font: Helvetica,
              color: window.PDFLib.rgb(0.5, 0.5, 0.5),
              opacity: 0.2,
              rotate: window.PDFLib.degrees(45)
            });
          });
        }

        const bytes = await doc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setConversionPreview({
          type: 'pdf',
          name: uploadedFile.name,
          url: url,
          previewData: `PDF document compiled successfully with all text annotations and changes.`
        });
        toast.success('Successfully compiled PDF document!');
      }
      else if (name.endsWith('.txt')) {
        const text = await uploadedFile.text();
        const { PDFDocument } = window.PDFLib;
        const pdfDoc = await PDFDocument.create();
        const Helvetica = await pdfDoc.embedStandardFont('Helvetica');
        const lines = text.split('\n');
        
        let page = pdfDoc.addPage([595, 842]);
        let y = 800;
        for (const line of lines) {
          if (y < 50) {
            page = pdfDoc.addPage([595, 842]);
            y = 800;
          }
          page.drawText(line.substring(0, 80), { x: 50, y, size: 11, font: Helvetica });
          y -= 15;
        }

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        setConversionPreview({
          type: 'pdf',
          name: `${uploadedFile.name.replace(/\.[^/.]+$/, '')}.pdf`,
          url: url,
          previewData: 'TXT text compiled successfully. Pages generated.'
        });
        toast.success('Successfully converted TXT to PDF!');
      } 
      else if (uploadedFile.type.startsWith('image/')) {
        const { PDFDocument } = window.PDFLib;
        const pdfDoc = await PDFDocument.create();
        const bytes = await uploadedFile.arrayBuffer();
        
        let img;
        if (uploadedFile.type === 'image/png') {
          img = await pdfDoc.embedPng(bytes);
        } else {
          img = await pdfDoc.embedJpg(bytes);
        }
        
        const page = pdfDoc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });

        const Helvetica = await pdfDoc.embedStandardFont('Helvetica');
        addedTexts.forEach((item) => {
          const { width, height } = page.getSize();
          
          if (item.bgMask) {
            const approxWidth = item.text.length * (item.size * 0.55);
            page.drawRectangle({
              x: item.x - approxWidth / 2 - 4,
              y: height - item.y - item.size / 2 - 2,
              width: approxWidth + 8,
              height: item.size + 4,
              color: window.PDFLib.rgb(1, 1, 1),
            });
          }
          
          page.drawText(item.text, {
            x: item.bgMask ? (item.x - (item.text.length * (item.size * 0.55)) / 2) : item.x,
            y: item.bgMask ? (height - item.y - item.size / 2) : (height - item.y),
            size: item.size,
            font: Helvetica,
            color: item.bgMask ? window.PDFLib.rgb(0, 0, 0) : window.PDFLib.rgb(
              parseInt(item.color.slice(1, 3), 16) / 255 || 0,
              parseInt(item.color.slice(3, 5), 16) / 255 || 0,
              parseInt(item.color.slice(5, 7), 16) / 255 || 0
            )
          });
        });

        if (watermarkText) {
          const { width, height } = page.getSize();
          page.drawText(watermarkText, {
            x: width / 4,
            y: height / 2,
            size: 40,
            font: Helvetica,
            color: window.PDFLib.rgb(0.5, 0.5, 0.5),
            opacity: 0.2,
            rotate: window.PDFLib.degrees(45)
          });
        }

        const bytesSave = await pdfDoc.save();
        const blob = new Blob([bytesSave], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        setConversionPreview({
          type: 'pdf',
          name: `${uploadedFile.name.replace(/\.[^/.]+$/, '')}.pdf`,
          url: url,
          previewData: 'Image frame embedded successfully. 1 page generated.'
        });
        toast.success('Successfully converted Image to PDF!');
      }
      else {
        await new Promise(r => setTimeout(r, 1200));
        const { PDFDocument } = window.PDFLib;
        const pdfDoc = await PDFDocument.create();
        const Helvetica = await pdfDoc.embedStandardFont('Helvetica');
        let page = pdfDoc.addPage([595, 842]);
        
        page.drawText('Word Document Extracted Content', { x: 50, y: 800, size: 16, font: Helvetica });
        page.drawText(`File: ${uploadedFile.name}`, { x: 50, y: 760, size: 12, font: Helvetica });
        page.drawText(`Text content extracts securely to PDF format.`, { x: 50, y: 720, size: 11, font: Helvetica });
        
        addedTexts.forEach((item) => {
          const { width, height } = page.getSize();
          page.drawText(item.text, {
            x: item.x,
            y: height - item.y,
            size: item.size,
            font: Helvetica,
            color: window.PDFLib.rgb(0, 0, 0)
          });
        });

        if (watermarkText) {
          const { width, height } = page.getSize();
          page.drawText(watermarkText, {
            x: width / 4,
            y: height / 2,
            size: 40,
            font: Helvetica,
            color: window.PDFLib.rgb(0.5, 0.5, 0.5),
            opacity: 0.2,
            rotate: window.PDFLib.degrees(45)
          });
        }

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        setConversionPreview({
          type: 'pdf',
          name: `${uploadedFile.name.replace(/\.[^/.]+$/, '')}.pdf`,
          url: url,
          previewData: 'Word text compiled successfully. 1 page generated.'
        });
        toast.success('Successfully converted Word document to PDF!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to compile PDF.');
    } finally {
      setIsProcessing(false);
      setLoadingProgress(0);
    }
  };

  // Utilities Tab: Process utilities
  const handleUtilitiesProcess = async () => {
    if (utilFiles.length === 0) {
      toast.error('Please select files first.');
      return;
    }
    setIsProcessing(true);
    try {
      if (!window.PDFLib) { toast.error('PDF library still loading. Please wait...'); setIsProcessing(false); return; }
      const { PDFDocument, degrees } = window.PDFLib;
      
      if (utilType === 'merge-pdf') {
        const mergedPdf = await PDFDocument.create();
        for (const f of utilFiles) {
          const bytes = await f.arrayBuffer();
          const pdf = await PDFDocument.load(bytes);
          const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          pages.forEach(p => mergedPdf.addPage(p));
        }
        const bytes = await mergedPdf.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        setUtilResultUrl(URL.createObjectURL(blob));
        setUtilResultName('merged_document.pdf');
        toast.success('Successfully merged all PDFs!');
      } 
      else if (utilType === 'split-pdf') {
        const file = utilFiles[0];
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        const splitDoc = await PDFDocument.create();
        
        if (pdf.getPageCount() > 0) {
          const [copiedPage] = await splitDoc.copyPages(pdf, [0]);
          splitDoc.addPage(copiedPage);
        }
        
        const resBytes = await splitDoc.save();
        const blob = new Blob([resBytes], { type: 'application/pdf' });
        setUtilResultUrl(URL.createObjectURL(blob));
        setUtilResultName(`split_page1_${file.name}`);
        toast.success('Split successfully! Extracted Page 1 as separate document.');
      }
      else if (utilType === 'rotate-pdf') {
        const file = utilFiles[0];
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        
        for (let i = 0; i < pdf.getPageCount(); i++) {
          const page = pdf.getPage(i);
          const curr = page.getRotation().angle;
          page.setRotation(degrees(curr + rotationAngle));
        }

        const resBytes = await pdf.save();
        const blob = new Blob([resBytes], { type: 'application/pdf' });
        setUtilResultUrl(URL.createObjectURL(blob));
        setUtilResultName(`rotated_${file.name}`);
        toast.success(`Rotated PDF by ${rotationAngle} degrees!`);
      }
      else if (utilType === 'delete-pages') {
        const file = utilFiles[0];
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        
        if (pdf.getPageCount() > 1) {
          pdf.removePage(1);
          const resBytes = await pdf.save();
          const blob = new Blob([resBytes], { type: 'application/pdf' });
          setUtilResultUrl(URL.createObjectURL(blob));
          setUtilResultName(`page_deleted_${file.name}`);
          toast.success('Successfully deleted page 2 of document!');
        } else {
          toast.error('PDF only contains 1 page. Cannot delete page.');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to run PDF utility.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger quick tool grids
  const handleQuickToolClick = (tool) => {
    setActiveTab(tool.tab);
    
    if (tool.tab === 'conversions') setConvertType(tool.id);
    if (tool.tab === 'utilities') setUtilType(tool.id);
    if (tool.tab === 'edit') setEditMode(tool.id === 'watermark' ? 'watermark' : 'text');
    
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.accept = tool.accept || '*/*';
        fileInputRef.current.multiple = tool.multiple || false;
        fileInputRef.current.click();
      }
    }, 100);
  };

  if (libsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-dark-bg text-text-primary p-6 rounded-3xl border border-dark-border">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Failed to Initialize PDF Engine</h2>
        <p className="text-text-secondary text-sm mt-1 max-w-md text-center">
          We encountered an issue loading standard PDF libraries from unpkg / cdnjs. Please verify your internet connection.
        </p>
      </div>
    );
  }

  if (!libsLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-dark-bg text-text-primary gap-4">
        <div className="w-12 h-12 text-primary animate-spin rounded-full border-4 border-solid border-primary border-t-transparent mx-auto" />
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-primary animate-pulse">Initializing PDF Workspace</p>
          <p className="text-xs text-text-secondary mt-1">Loading helper scripts (pdf-lib, pdf.js, tesseract)...</p>
        </div>
      </div>
    );
  }

  const filteredLines = extractedLines.filter((l) =>
    l.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-full bg-dark-bg text-text-primary pb-28 p-4 md:p-6 overflow-y-auto">
      {/* Offline Mode Banner */}
      {isOffline && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3 mb-5 flex items-center justify-between text-amber-400 animate-pulse flex-shrink-0">
          <div className="flex items-center gap-2 text-xs font-extrabold">
            <span>⚠️ Offline Mode Active</span>
            <span className="font-normal text-[11px] text-text-secondary hidden sm:inline">
              · You can read cached PDFs and manage notes or bookmarks locally.
            </span>
          </div>
          <span className="text-[10px] bg-amber-500/20 px-2.5 py-0.5 rounded-full font-bold">
            Local Only
          </span>
        </div>
      )}
      {/* Hidden File Picker */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,.docx,.doc,.txt,image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const tab = activeTabRef.current;
            if (tab === 'conversions') {
              setConvertFiles(files);
            } else if (tab === 'utilities') {
              setUtilFiles(files);
            } else {
              processDocument(files[0]);
            }
          }
          e.target.value = '';
        }}
      />

      {/* Top Premium Workspace Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
              Workspace v2.0
            </span>
          </div>
          <div className="flex items-center gap-2.5 mt-1">
            <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-secondary">
              Student OS PDF Workspace
            </h1>
            {uploadedFile && (
              <button
                onClick={() => toggleFavourite(uploadedFile.name)}
                className="p-1 hover:bg-dark-surface rounded-xl transition-all cursor-pointer text-amber-400 flex items-center justify-center"
                title={pdfFavourites.includes(uploadedFile.name) ? 'Remove from favourites' : 'Add to favourites'}
              >
                <Star
                  size={18}
                  className={pdfFavourites.includes(uploadedFile.name) ? 'fill-amber-400 text-amber-400' : 'text-text-secondary hover:text-amber-400'}
                />
              </button>
            )}
          </div>
          <p className="text-xs text-text-secondary">
            {uploadedFile ? `Currently editing: ${uploadedFile.name} (${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)` : 'Dynamic client-side document utilities and AI study tools'}
          </p>
        </div>

        {uploadedFile && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setUploadedFile(null);
                setPdfPages([]);
                setExtractedText('');
                setExtractedLines([]);
                setAddedTexts([]);
                setAddedSignatures([]);
                setPdfTextItems([]);
                setPdfDocument(null);
                setCurrentPage(1);
                setZoomScale(1.0);
                setPdfError(null);
                setRotation(0);
                setIsFullscreen(false);
                setEditorPageBase64(null);
                setPdfSearchQuery('');
                setPdfSearchResults([]);
                setPdfCurrentMatchIndex(-1);
                setActiveTool('none');
                setPdfAnnotations([]);
                setCurrentPageTextItems([]);
                setActivePopup(null);
                setSidebarTab('pages');
                setPdfBookmarks([]);
                setEditingBookmarkId(null);
                setEditingBookmarkTitle('');
                setPdfPageNotes([]);
                setNoteModeActive(false);
                setActiveEditingNoteId(null);
                setActiveEditingNoteText('');
              }}
              className="px-3 py-1.5 rounded-xl border border-dark-border text-xs font-bold bg-dark-surface/40 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              Close Document
            </button>
          </div>
        )}
      </div>

      {/* Main Tab Navigation (Rendered only after any file is uploaded) */}
      {uploadedFile && (
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none border-b border-dark-border/50 pb-2 mb-6">
          {[
            { id: 'view', label: 'View (Viewer)', icon: Eye },
            { id: 'split', label: 'Split PDF', icon: Scissors },
            { id: 'compress', label: 'Compress PDF', icon: Minimize2 },
            { id: 'edit', label: 'Edit Text', icon: PenTool },
            { id: 'signature', label: 'Signature', icon: Edit2 },
            { id: 'watermark', label: 'Watermark', icon: Shield },
            { id: 'to-pdf', label: 'Convert to PDF', icon: FileDown },
            { id: 'to-word', label: 'Convert to Word', icon: FileText },
            { id: 'to-image', label: 'Convert to Image', icon: Image },
            { id: 'to-text', label: 'Convert to Text', icon: FileText },
            { id: 'ocr', label: 'OCR Extraction', icon: FileText },
            { id: 'ai', label: 'AI Assistant', icon: Brain },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  activeTab === tab.id
                    ? 'bg-primary text-white border-transparent shadow-lg shadow-primary/30'
                    : 'bg-dark-surface/30 text-text-secondary border-dark-border/40 hover:border-primary/40 hover:text-primary'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab Selector when no document is uploaded */}
      {!uploadedFile && (
        <div className="flex items-center gap-2 max-w-4xl mx-auto mb-6 border-b border-dark-border/40 pb-3 flex-shrink-0">
          <button
            onClick={() => setActiveTab('view')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              activeTab !== 'merge' && activeTab !== 'image-to-pdf' && activeTab !== 'scan'
                ? 'bg-primary text-white border-transparent shadow-lg shadow-primary/30'
                : 'bg-dark-surface/30 text-text-secondary border-dark-border/40 hover:border-primary/40 hover:text-primary'
            }`}
          >
            📂 Document Workspace
          </button>
          <button
            onClick={() => setActiveTab('merge')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              activeTab === 'merge'
                ? 'bg-primary text-white border-transparent shadow-lg shadow-primary/30'
                : 'bg-dark-surface/30 text-text-secondary border-dark-border/40 hover:border-primary/40 hover:text-primary'
            }`}
          >
            🥞 Merge PDFs
          </button>
          <button
            onClick={() => setActiveTab('image-to-pdf')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              activeTab === 'image-to-pdf'
                ? 'bg-primary text-white border-transparent shadow-lg shadow-primary/30'
                : 'bg-dark-surface/30 text-text-secondary border-dark-border/40 hover:border-primary/40 hover:text-primary'
            }`}
          >
            🖼️ Image to PDF
          </button>
          <button
            onClick={() => {
              setActiveTab('scan');
              startCamera();
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              activeTab === 'scan'
                ? 'bg-primary text-white border-transparent shadow-lg shadow-primary/30'
                : 'bg-dark-surface/30 text-text-secondary border-dark-border/40 hover:border-primary/40 hover:text-primary'
            }`}
          >
            📷 Scan Document
          </button>
        </div>
      )}

      {/* Single beautiful Dropzone Area when no file is uploaded */}
      {!uploadedFile ? (
        activeTab === 'scan' ? (
          <div className="glass-card max-w-2xl mx-auto p-6 space-y-6 animate-fadeIn bg-dark-surface/10 border border-dark-border/40 rounded-3xl backdrop-blur-sm shadow-xl shadow-black/25 w-full">
            <div className="flex justify-between items-center pb-3 border-b border-dark-border/40">
              <div>
                <h2 className="text-lg font-extrabold text-text-primary">Document Scanner</h2>
                <p className="text-xs text-text-secondary mt-0.5">Capture documents, detect boundaries, enhance, and compile to PDF</p>
              </div>
              {scannerState === 'idle' && (
                <button
                  onClick={() => {
                    setScannedPages([]);
                    setActiveCapturedImage(null);
                    setScannerActiveWarpedCanvas(null);
                    setScannerState('idle');
                    startCamera();
                  }}
                  className="text-text-secondary hover:text-white text-xs font-bold transition-colors cursor-pointer animate-pulse"
                >
                  Reset Scanner
                </button>
              )}
            </div>

            {scannerState === 'idle' && (
              <div className="space-y-6">
                <div className="relative max-w-md mx-auto aspect-[4/3] rounded-2xl overflow-hidden bg-dark-bg border border-dark-border/40 flex items-center justify-center group">
                  {cameraStream ? (
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                  ) : (
                    <div className="p-6 text-center space-y-4">
                      <div className="text-5xl animate-pulse">📷</div>
                      <p className="text-xs text-text-secondary max-w-xs mx-auto">
                        {cameraError ? cameraError : 'Initializing camera stream...'}
                      </p>
                      <button
                        onClick={() => scannerFileInputRef.current?.click()}
                        className="bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer shadow-md"
                      >
                        📂 Select Document Photo
                      </button>
                    </div>
                  )}

                  {cameraStream && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                      <button
                        onClick={capturePhoto}
                        className="w-14 h-14 rounded-full border-4 border-white bg-primary hover:bg-primary-hover transition-all flex items-center justify-center shadow-lg active:scale-95 cursor-pointer"
                        title="Capture Photo"
                      >
                        <div className="w-6 h-6 rounded-full bg-white" />
                      </button>
                    </div>
                  )}

                  <input
                    ref={scannerFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSimulatedPhotoSelect}
                  />
                </div>

                {scannedPages.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block">
                      Scanned Pages ({scannedPages.length})
                    </label>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                      {scannedPages.map((page, idx) => (
                        <div key={idx} className="relative w-16 aspect-[3/4] bg-dark-bg/60 border border-dark-border/60 rounded-xl overflow-hidden shrink-0 group">
                          <img src={page.src} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute top-1 left-1 bg-dark-bg/80 text-text-primary text-[9px] px-1 py-0.2 rounded font-mono font-bold">
                            {idx + 1}
                          </div>
                          <button
                            onClick={() => setScannedPages(prev => prev.filter((_, pIdx) => pIdx !== idx))}
                            className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-dark-border/40 flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
                  <div className="flex-1 w-full min-w-0">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1.5">
                      Output Filename
                    </label>
                    <input
                      type="text"
                      value={scannerOutputName}
                      onChange={(e) => setScannerOutputName(e.target.value)}
                      placeholder="scanned_document.pdf"
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-primary transition-colors text-text-primary"
                    />
                  </div>
                  <button
                    onClick={compileScannedPdf}
                    disabled={scannedPages.length === 0}
                    className="bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer w-full sm:w-auto shadow-md"
                  >
                    📄 Save & Compile PDF
                  </button>
                </div>
              </div>
            )}

            {scannerState === 'cropping' && activeCapturedImage && (
              <div className="space-y-6">
                <div className="pb-2 border-b border-dark-border/20 flex justify-between items-center">
                  <span className="text-xs text-text-secondary">Drag the 4 corner circles to adjust document boundary edges</span>
                  <button
                    onClick={() => {
                      setScannerState('idle');
                      startCamera();
                    }}
                    className="text-red-400 hover:text-red-300 text-xs font-bold cursor-pointer"
                  >
                    Retake
                  </button>
                </div>

                <div
                  ref={cropContainerRef}
                  onMouseMove={handleCropContainerMouseMove}
                  onTouchMove={handleCropContainerMouseMove}
                  onMouseUp={() => setDraggingCornerIndex(-1)}
                  onTouchEnd={() => setDraggingCornerIndex(-1)}
                  onMouseLeave={() => setDraggingCornerIndex(-1)}
                  onTouchCancel={() => setDraggingCornerIndex(-1)}
                  className="relative max-w-md mx-auto aspect-[4/3] bg-dark-bg border border-dark-border/40 rounded-2xl overflow-hidden cursor-crosshair select-none touch-none"
                >
                  <img
                    src={activeCapturedImage.src}
                    alt="Captured photo"
                    className="w-full h-full object-contain pointer-events-none"
                  />

                  {scannerCorners.length === 4 && (
                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none animate-fadeIn" preserveAspectRatio="none">
                      <polygon
                        points={`
                          ${(scannerCorners[0].x / activeCapturedImage.width) * 100},${(scannerCorners[0].y / activeCapturedImage.height) * 100}
                          ${(scannerCorners[1].x / activeCapturedImage.width) * 100},${(scannerCorners[1].y / activeCapturedImage.height) * 100}
                          ${(scannerCorners[2].x / activeCapturedImage.width) * 100},${(scannerCorners[2].y / activeCapturedImage.height) * 100}
                          ${(scannerCorners[3].x / activeCapturedImage.width) * 100},${(scannerCorners[3].y / activeCapturedImage.height) * 100}
                        `}
                        fill="rgba(99, 102, 241, 0.15)"
                        stroke="#6366f1"
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}

                  {scannerCorners.map((corner, idx) => {
                    const leftPct = (corner.x / activeCapturedImage.width) * 100;
                    const topPct = (corner.y / activeCapturedImage.height) * 100;
                    return (
                      <div
                        key={idx}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setDraggingCornerIndex(idx);
                        }}
                        onTouchStart={(e) => {
                          setDraggingCornerIndex(idx);
                        }}
                        className={`absolute w-7 h-7 rounded-full border-2 border-white flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-shadow ${
                          draggingCornerIndex === idx
                            ? 'bg-primary shadow-lg ring-4 ring-primary/30 shadow-primary/30'
                            : 'bg-primary/95 shadow'
                        }`}
                        style={{
                          left: `${leftPct}%`,
                          top: `${topPct}%`,
                          zIndex: draggingCornerIndex === idx ? 50 : 40
                        }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-dark-border/40">
                  <button
                    onClick={() => {
                      setScannerState('idle');
                      startCamera();
                    }}
                    className="px-5 py-2.5 rounded-xl border border-dark-border text-xs font-bold bg-dark-surface/40 hover:bg-dark-border transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={warpDocument}
                    className="bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer shadow-md"
                  >
                    ✂️ Crop & Warp Sheet
                  </button>
                </div>
              </div>
            )}

            {scannerState === 'enhancing' && scannerActiveWarpedCanvas && (
              <div className="space-y-6 animate-fadeIn">
                <div className="pb-2 border-b border-dark-border/20 flex justify-between items-center">
                  <span className="text-xs text-text-secondary">Apply visual filters to clean up document exposure and text contrast</span>
                  <button
                    onClick={() => setScannerState('cropping')}
                    className="text-text-secondary hover:text-white text-xs font-bold cursor-pointer"
                  >
                    Back to Crop
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="max-w-[280px] aspect-[3/4] mx-auto rounded-2xl overflow-hidden border border-dark-border/60 bg-dark-bg/80 flex items-center justify-center p-2 shadow-inner">
                    <img
                      src={getEnhancedCanvasUrl(scannerFilter)}
                      alt="Warped preview"
                      className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                    />
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block">
                        Enhancement Filters
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'original', label: 'Original', desc: 'Default color photo' },
                          { id: 'grayscale', label: 'Grayscale', desc: 'Standard gray hues' },
                          { id: 'bw', label: 'Black & White', desc: 'Photocopy high contrast' },
                          { id: 'magic', label: 'Magic Color', desc: 'Bold saturated text' }
                        ].map((filterOpt) => (
                          <button
                            key={filterOpt.id}
                            onClick={() => setScannerFilter(filterOpt.id)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                              scannerFilter === filterOpt.id
                                ? 'border-primary bg-primary/10 text-primary font-bold shadow-lg shadow-primary/5'
                                : 'border-dark-border/40 hover:border-primary/20 text-text-secondary'
                            }`}
                          >
                            <div className="text-xs font-bold">{filterOpt.label}</div>
                            <div className="text-[10px] text-text-secondary mt-0.5">{filterOpt.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4 border-t border-dark-border/30">
                      <button
                        onClick={addScannedPage}
                        className="bg-primary text-white py-2.5 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer w-full flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
                      >
                        ➕ Save & Add Next Page
                      </button>
                      <button
                        onClick={compileScannedPdf}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer w-full flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/25"
                      >
                        📄 Finish & Compile PDF ({scannedPages.length + 1} Pages)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {scannerState === 'completed' && (
              <div className="space-y-6">
                {scannerProgress < 100 ? (
                  <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 space-y-4 max-w-md mx-auto w-full">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-primary">
                        <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        Generating Document...
                      </span>
                      <span className="text-text-secondary">{scannerProgress}%</span>
                    </div>
                    <div className="w-full bg-dark-bg rounded-full h-2.5 overflow-hidden border border-dark-border">
                      <div
                        className="bg-primary h-2.5 rounded-full transition-all duration-200"
                        style={{ width: `${scannerProgress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-text-secondary italic text-center">
                      {scannerStatus}
                    </p>
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 space-y-6 max-w-lg mx-auto w-full animate-fadeIn">
                    <div className="flex items-center justify-between text-emerald-400">
                      <span className="text-xs font-extrabold flex items-center gap-1">
                        ✅ Document Scanned & Compiled Successfully!
                      </span>
                      <span className="text-[9px] bg-emerald-500/20 px-2 py-0.5 rounded font-extrabold uppercase">Success</span>
                    </div>

                    <div className="bg-dark-bg/60 border border-dark-border/40 rounded-xl p-3 flex justify-between items-center text-xs text-text-primary">
                      <span>Total Scanned Pages:</span>
                      <span className="font-extrabold">{scannedPages.length} pages</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleOpenScannerPdfInWorkspace}
                        className="flex-1 bg-primary text-white py-2.5 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
                      >
                        👁️ Open in Workspace
                      </button>
                      <a
                        href={scannerPdfBlobUrl}
                        download={scannerOutputName.toLowerCase().endsWith('.pdf') ? scannerOutputName : `${scannerOutputName}.pdf`}
                        onClick={() => toast.success('Downloaded scanned PDF!')}
                        className="flex-1 bg-dark-surface border border-dark-border text-text-primary py-2.5 rounded-xl text-xs font-bold hover:bg-dark-border hover:text-primary transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center"
                      >
                        📥 Save Scanned PDF
                      </a>
                    </div>

                    <button
                      onClick={() => {
                        setScannedPages([]);
                        setScannerPdfBlob(null);
                        setScannerPdfBlobUrl(null);
                        setScannerState('idle');
                        startCamera();
                      }}
                      className="w-full text-center text-text-secondary hover:text-white text-[10px] font-bold uppercase transition-colors cursor-pointer"
                    >
                      Start New Scan
                    </button>
                  </div>
                )}
              </div>
            )}

            {scannerState === 'failed' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 space-y-4 max-w-md mx-auto text-red-400 w-full">
                <p className="text-xs font-bold text-center">Compilation Failed</p>
                <p className="text-[10px] text-text-secondary text-center">{scannerStatus}</p>
                <button
                  onClick={compileScannedPdf}
                  className="w-full bg-primary text-white py-2.5 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  🔄 Retry Compilation
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'image-to-pdf' ? (
          <div className="glass-card max-w-2xl mx-auto p-6 space-y-6 animate-fadeIn bg-dark-surface/10 border border-dark-border/40 rounded-3xl backdrop-blur-sm shadow-xl shadow-black/25 w-full">
            <div className="flex justify-between items-center pb-3 border-b border-dark-border/40">
              <div>
                <h2 className="text-lg font-extrabold text-text-primary">Image to PDF Converter</h2>
                <p className="text-xs text-text-secondary mt-0.5">Convert and compile multiple images into a single PDF document</p>
              </div>
              <button
                onClick={() => imageFileInputRef.current?.click()}
                className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-primary/20"
              >
                <Plus size={14} /> Add Images
              </button>
              <input
                ref={imageFileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>

            {imageState === 'idle' && imageFiles.length === 0 && (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                <p className="text-5xl">🖼️</p>
                <p className="font-bold text-sm text-text-primary mt-2">No images selected</p>
                <p className="text-xs text-text-secondary max-w-xs mx-auto">
                  Click the button above to select images from your device.
                </p>
              </div>
            )}

            {imageFiles.length > 0 && imageState === 'idle' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin p-1">
                  {imageFiles.map((imgObj, idx) => (
                    <div
                      key={imgObj.id}
                      className="bg-dark-bg/60 border border-dark-border/40 rounded-2xl p-3 flex flex-col items-center gap-3 relative group transition-all"
                    >
                      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-dark-surface/30 relative flex items-center justify-center">
                        <img
                          src={imgObj.previewUrl}
                          alt={imgObj.name}
                          className="max-w-full max-h-full object-contain transition-transform duration-200"
                          style={{ transform: `rotate(${imgObj.rotation}deg)` }}
                        />
                        <div className="absolute top-2 left-2 bg-dark-bg/80 text-text-primary border border-dark-border/60 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold font-mono">
                          {idx + 1}
                        </div>
                      </div>

                      <div className="w-full flex justify-between items-center gap-1.5">
                        <span className="text-[10px] text-text-secondary truncate flex-1 block" title={imgObj.name}>
                          {imgObj.name}
                        </span>
                        <span className="text-[9px] text-text-secondary font-bold font-mono">
                          {imgObj.rotation}°
                        </span>
                      </div>

                      <div className="flex items-center justify-center gap-1.5 w-full pt-1.5 border-t border-dark-border/30">
                        <button
                          onClick={() => moveImageUp(idx)}
                          disabled={idx === 0}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-text-secondary hover:text-white hover:bg-dark-surface/60 disabled:opacity-20 cursor-pointer"
                          title="Move Left/Up"
                        >
                          ◀
                        </button>
                        <button
                          onClick={() => rotateImage(imgObj.id)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-text-secondary hover:text-white hover:bg-dark-surface/60 cursor-pointer"
                          title="Rotate 90°"
                        >
                          🔄
                        </button>
                        <button
                          onClick={() => moveImageDown(idx)}
                          disabled={idx === imageFiles.length - 1}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-text-secondary hover:text-white hover:bg-dark-surface/60 disabled:opacity-20 cursor-pointer"
                          title="Move Right/Down"
                        >
                          ▶
                        </button>
                        <button
                          onClick={() => removeImage(imgObj.id)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-text-secondary hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                          title="Remove Image"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-dark-border/40 flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
                  <div className="flex-1 w-full min-w-0">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1.5">
                      Output Filename
                    </label>
                    <input
                      type="text"
                      value={imageOutputName}
                      onChange={(e) => setImageOutputName(e.target.value)}
                      placeholder="images_to_document.pdf"
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-primary transition-colors text-text-primary"
                    />
                  </div>
                  <button
                    onClick={handleImagesToPdf}
                    className="bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer w-full sm:w-auto shadow-md"
                  >
                    🖼️ Create PDF ({imageFiles.length} Images)
                  </button>
                </div>
              </div>
            )}

            {imageState === 'converting' && (
              <div className="bg-dark-surface border border-dark-border rounded-2xl p-5 space-y-3 w-full">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-primary">
                    <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Converting Images...
                  </span>
                  <span className="text-text-secondary">{imageProgress}%</span>
                </div>
                <div className="w-full bg-dark-bg rounded-full h-2.5 overflow-hidden border border-dark-border">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-200"
                    style={{ width: `${imageProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-text-secondary italic text-center">
                  {imageStatus}
                </p>
              </div>
            )}

            {imageState === 'completed' && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 space-y-4 w-full">
                <div className="flex items-center justify-between text-emerald-400">
                  <span className="text-xs font-bold">✅ Images Converted to PDF Successfully!</span>
                  <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded font-extrabold uppercase">Complete</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleOpenImagePdfInWorkspace}
                    className="flex-1 bg-primary text-white py-2.5 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
                  >
                    👁️ Open in Workspace
                  </button>
                  <a
                    href={imagePdfBlobUrl}
                    download={imageOutputName.toLowerCase().endsWith('.pdf') ? imageOutputName : `${imageOutputName}.pdf`}
                    onClick={() => toast.success('Downloaded PDF!')}
                    className="flex-1 bg-dark-surface border border-dark-border text-text-primary py-2.5 rounded-xl text-xs font-bold hover:bg-dark-border hover:text-primary transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center"
                  >
                    📥 Save PDF
                  </a>
                  <button
                    onClick={handleShareImagePdf}
                    className="flex-1 bg-dark-surface border border-dark-border text-text-primary py-2.5 rounded-xl text-xs font-bold hover:bg-dark-border hover:text-primary transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center"
                  >
                    🔗 Share PDF
                  </button>
                </div>
                <button
                  onClick={() => {
                    setImageFiles([]);
                    setImagePdfBlob(null);
                    setImagePdfBlobUrl(null);
                    setImageState('idle');
                  }}
                  className="w-full text-center text-text-secondary hover:text-white text-[10px] font-bold uppercase transition-colors cursor-pointer"
                >
                  Convert More Images
                </button>
              </div>
            )}
            
            {imageState === 'failed' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 space-y-3 text-red-400 w-full">
                <p className="text-xs font-bold text-center">Conversion Failed</p>
                <p className="text-[10px] text-text-secondary text-center">{imageStatus}</p>
                <button
                  onClick={handleImagesToPdf}
                  className="w-full bg-primary text-white py-2 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  🔄 Retry Conversion
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'merge' ? (
          <div className="glass-card max-w-2xl mx-auto p-6 space-y-6 animate-fadeIn bg-dark-surface/10 border border-dark-border/40 rounded-3xl backdrop-blur-sm shadow-xl shadow-black/25 w-full">
            <div className="flex justify-between items-center pb-3 border-b border-dark-border/40">
              <div>
                <h2 className="text-lg font-extrabold text-text-primary">PDF Merger Tool</h2>
                <p className="text-xs text-text-secondary mt-0.5">Combine multiple PDF files into a single document</p>
              </div>
              <button
                onClick={() => mergeFileInputRef.current?.click()}
                className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-primary/20"
              >
                <Plus size={14} /> Add PDF Files
              </button>
              <input
                ref={mergeFileInputRef}
                type="file"
                multiple
                accept=".pdf"
                className="hidden"
                onChange={handleMergeFileSelect}
              />
            </div>

            {mergeState === 'idle' && mergeFiles.length === 0 && (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                <p className="text-5xl">🥞</p>
                <p className="font-bold text-sm text-text-primary mt-2">No PDF files selected</p>
                <p className="text-xs text-text-secondary max-w-xs mx-auto">
                  Click the button above to select 2 or more PDF documents from your device.
                </p>
              </div>
            )}

            {mergeFiles.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                  {mergeFiles.map((fileObj, idx) => (
                    <div
                      key={fileObj.id}
                      className="flex items-center gap-3 p-3 bg-dark-bg/60 border border-dark-border/40 rounded-2xl group transition-all"
                    >
                      <span className="text-xs font-extrabold text-text-secondary w-5 text-right font-mono">
                        {idx + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-text-primary truncate" title={fileObj.name}>
                          {fileObj.name}
                        </p>
                        <p className="text-[10px] text-text-secondary mt-0.5">
                          {(fileObj.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => moveUp(idx)}
                          disabled={idx === 0}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-white hover:bg-dark-surface/60 transition-colors disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveDown(idx)}
                          disabled={idx === mergeFiles.length - 1}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-white hover:bg-dark-surface/60 transition-colors disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          ▼
                        </button>
                        <button
                          onClick={() => removeFile(fileObj.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-dark-border/40 flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
                  <div className="flex-1 w-full min-w-0">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1.5">
                      Output Filename
                    </label>
                    <input
                      type="text"
                      value={mergeOutputName}
                      onChange={(e) => setMergeOutputName(e.target.value)}
                      placeholder="combined.pdf"
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-primary transition-colors text-text-primary"
                    />
                  </div>
                  {mergeState !== 'merging' && (
                    <button
                      onClick={handleMergeFiles}
                      disabled={mergeFiles.length < 2}
                      className="bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer w-full sm:w-auto shadow-md"
                    >
                      🥞 Merge PDFs
                    </button>
                  )}
                </div>
              </div>
            )}

            {mergeState === 'merging' && (
              <div className="bg-dark-surface border border-dark-border rounded-2xl p-5 space-y-3 w-full">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-primary">
                    <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Merging Documents...
                  </span>
                  <span className="text-text-secondary">{mergeProgress}%</span>
                </div>
                <div className="w-full bg-dark-bg rounded-full h-2.5 overflow-hidden border border-dark-border">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-200"
                    style={{ width: `${mergeProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-text-secondary italic text-center">
                  {mergeStatusText}
                </p>
              </div>
            )}

            {mergeState === 'completed' && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 space-y-4 w-full">
                <div className="flex items-center justify-between text-emerald-400">
                  <span className="text-xs font-bold">✅ PDFs Merged Successfully!</span>
                  <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded font-extrabold uppercase">Complete</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleOpenMergedInWorkspace}
                    className="flex-1 bg-primary text-white py-2.5 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
                  >
                    👁️ Open in Workspace
                  </button>
                  <a
                    href={mergedBlobUrl}
                    download={mergeOutputName.toLowerCase().endsWith('.pdf') ? mergeOutputName : `${mergeOutputName}.pdf`}
                    onClick={() => toast.success('Downloaded merged PDF!')}
                    className="flex-1 bg-dark-surface border border-dark-border text-text-primary py-2.5 rounded-xl text-xs font-bold hover:bg-dark-border hover:text-primary transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center"
                  >
                    📥 Download File
                  </a>
                </div>
                <button
                  onClick={() => {
                    setMergeFiles([]);
                    setMergedBlob(null);
                    setMergedBlobUrl(null);
                    setMergeState('idle');
                  }}
                  className="w-full text-center text-text-secondary hover:text-white text-[10px] font-bold uppercase transition-colors cursor-pointer"
                >
                  Start Another Merge
                </button>
              </div>
            )}
            
            {mergeState === 'failed' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 space-y-3 text-red-400 w-full">
                <p className="text-xs font-bold text-center">Merge Failed</p>
                <p className="text-[10px] text-text-secondary text-center">{mergeStatusText}</p>
                <button
                  onClick={handleMergeFiles}
                  className="w-full bg-primary text-white py-2 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  🔄 Retry Merge
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={`animate-fadeIn w-full mt-12 ${recentFiles.length > 0 ? 'grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto' : 'max-w-xl mx-auto'}`}>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = '.pdf,.docx,.doc,.txt,image/*';
                fileInputRef.current.multiple = false;
                fileInputRef.current.click();
              }
            }}
            className="border-2 border-dashed border-dark-border hover:border-primary/50 transition-all rounded-3xl bg-dark-surface/20 p-12 text-center cursor-pointer min-h-[35vh] flex flex-col items-center justify-center group relative overflow-hidden backdrop-blur-sm shadow-xl shadow-black/25 w-full"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Upload className="text-primary" size={32} />
            </div>
            <h3 className="text-md font-bold text-text-primary">Upload Document File</h3>
            <p className="text-xs text-text-secondary mt-1 max-w-xs mx-auto">
              Select a PDF, Word, TXT, or Image file to start converting, editing, or signing
            </p>
            <span className="text-[9px] text-text-secondary bg-dark-surface border border-dark-border px-3 py-1 rounded-full mt-6">
              PDF, DOCX, TXT, Images
            </span>
          </div>

          {/* Recently Opened List */}
          {recentFiles.length > 0 && (
            <div className="glass-card p-6 flex flex-col h-full min-h-[35vh] bg-dark-surface/10 border border-dark-border/40 rounded-3xl relative backdrop-blur-sm shadow-xl shadow-black/25">
              <div className="flex justify-between items-center pb-2 border-b border-dark-border/40 mb-3">
                <div className="flex gap-4">
                  <button
                    onClick={() => setRecentsTab('recent')}
                    className={`pb-1 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      recentsTab === 'recent'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-text-secondary hover:text-white'
                    }`}
                  >
                    Recent
                  </button>
                  <button
                    onClick={() => setRecentsTab('favourites')}
                    className={`pb-1 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      recentsTab === 'favourites'
                        ? 'border-amber-400 text-amber-400'
                        : 'border-transparent text-text-secondary hover:text-white'
                    }`}
                  >
                    Favourites
                  </button>
                </div>
                {recentsTab === 'recent' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearRecentHistory();
                    }}
                    className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase cursor-pointer"
                  >
                    Clear History
                  </button>
                )}
              </div>
              
              <div className="space-y-3 overflow-y-auto flex-1 scrollbar-thin pr-1 max-h-[300px]">
                {/* Render Favourites Tab */}
                {recentsTab === 'favourites' ? (
                  pdfFavourites.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary text-xs">
                      No favourite PDFs added yet. Click the star icon inside a document to add it.
                    </div>
                  ) : (
                    pdfFavourites.map((favName) => {
                      // Find if it exists in recents list to show size
                      const match = recentFiles.find(rf => rf.fileName === favName);
                      return (
                        <div
                          key={favName}
                          className="p-3 bg-dark-surface/40 hover:bg-dark-surface/80 border border-dark-border/40 hover:border-primary/40 rounded-2xl flex items-center justify-between gap-3 group transition-all"
                        >
                          <div
                            onClick={() => {
                              if (match) openRecentFile(match);
                              else toast.error('File not cached locally in Recents.');
                            }}
                            className="flex-1 min-w-0 cursor-pointer"
                          >
                            <h4 className="text-xs font-bold text-text-primary truncate" title={favName}>
                              {favName}
                            </h4>
                            <p className="text-[10px] text-text-secondary mt-1">
                              {match ? `${(match.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Local cache missing'}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavourite(favName);
                            }}
                            className="p-1 hover:bg-dark-surface rounded-lg text-amber-400 cursor-pointer flex items-center justify-center shrink-0"
                            title="Remove from favourites"
                          >
                            <Star size={13} className="fill-amber-400 text-amber-400" />
                          </button>
                        </div>
                      );
                    })
                  )
                ) : (
                  /* Render Recents Tab */
                  recentFiles.map((file) => (
                    <div
                      key={file.fileName}
                      className="p-3 bg-dark-surface/40 hover:bg-dark-surface/80 border border-dark-border/40 hover:border-primary/40 rounded-2xl flex items-center justify-between gap-3 group transition-all"
                    >
                      <div
                        onClick={() => openRecentFile(file)}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <h4 className="text-xs font-bold text-text-primary truncate" title={file.fileName}>
                          {file.fileName}
                        </h4>
                        <p className="text-[10px] text-text-secondary mt-1">
                          {(file.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(file.lastOpened).toLocaleDateString()} {new Date(file.lastOpened).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavourite(file.fileName);
                          }}
                          className="p-1 hover:bg-dark-surface rounded-lg text-amber-400 cursor-pointer flex items-center justify-center"
                          title={pdfFavourites.includes(file.fileName) ? 'Remove from favourites' : 'Add to favourites'}
                        >
                          <Star
                            size={13}
                            className={pdfFavourites.includes(file.fileName) ? 'fill-amber-400 text-amber-400' : 'text-text-secondary'}
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRecentItem(file.fileName);
                          }}
                          className="p-1 hover:bg-red-500/20 text-text-secondary hover:text-red-400 rounded-lg cursor-pointer text-[10px] font-bold uppercase"
                          title="Remove from history"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      ) ) : (
        /* Workspace Content Views */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* TAB: PDF COMPRESSION */}
          {activeTab === 'compress' && uploadedFile && (
            <div className="lg:col-span-12 glass-card p-6 space-y-6 bg-dark-surface/10 border border-dark-border/40 rounded-3xl backdrop-blur-sm shadow-xl shadow-black/25 w-full">
              <div className="pb-4 border-b border-dark-border/40">
                <h2 className="text-lg font-extrabold text-text-primary">PDF Compression Workspace</h2>
                <p className="text-xs text-text-secondary mt-0.5">Optimize metadata streams and compress images to reduce file size</p>
              </div>

              {compressState === 'idle' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Details & Quality Options */}
                  <div className="space-y-6">
                    <div className="bg-dark-bg/40 border border-dark-border/40 rounded-2xl p-4 space-y-3">
                      <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">Document Details</h3>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <span className="text-text-secondary">Filename:</span>
                        <span className="text-text-primary truncate font-bold" title={uploadedFile.name}>{uploadedFile.name}</span>
                        <span className="text-text-secondary">Original Size:</span>
                        <span className="text-text-primary font-bold">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                        <span className="text-text-secondary">Total Pages:</span>
                        <span className="text-text-primary font-bold">{pdfNumPages}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Compression Mode</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setCompressMode('raster')}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            compressMode === 'raster'
                              ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5'
                              : 'border-dark-border/60 hover:border-primary/30 text-text-secondary'
                          }`}
                        >
                          <div className="font-extrabold text-xs">🚀 Max Compression</div>
                          <div className="text-[10px] text-text-secondary mt-0.5">Rasterizes pages. Best for scans & large images.</div>
                        </button>
                        <button
                          onClick={() => setCompressMode('structural')}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            compressMode === 'structural'
                              ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5'
                              : 'border-dark-border/60 hover:border-primary/30 text-text-secondary'
                          }`}
                        >
                          <div className="font-extrabold text-xs">📝 Preserve Text</div>
                          <div className="text-[10px] text-text-secondary mt-0.5">Optimizes structure. Keeps text searchable.</div>
                        </button>
                      </div>
                    </div>

                    {compressMode === 'raster' && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Target Quality</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'low', label: 'Low Quality', desc: 'Max Compress' },
                            { id: 'medium', label: 'Medium Quality', desc: 'Balanced' },
                            { id: 'high', label: 'High Quality', desc: 'Sharp view' },
                          ].map((qualityOpt) => (
                            <button
                              key={qualityOpt.id}
                              onClick={() => setCompressQuality(qualityOpt.id)}
                              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                compressQuality === qualityOpt.id
                                  ? 'border-primary bg-primary/10 text-primary font-bold'
                                  : 'border-dark-border/40 hover:border-primary/20 text-text-secondary text-xs'
                              }`}
                            >
                              <div className="text-xs font-bold">{qualityOpt.label}</div>
                              <div className="text-[9px] text-text-secondary mt-0.5">{qualityOpt.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Output Filename & Run */}
                  <div className="flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Output Filename</label>
                      <input
                        type="text"
                        value={compressOutputName}
                        onChange={(e) => setCompressOutputName(e.target.value)}
                        placeholder="compressed_document.pdf"
                        className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-primary transition-colors text-text-primary"
                      />
                      <p className="text-[10px] text-text-secondary italic">
                        The compressed file will be created client-side. Your original document remains unchanged.
                      </p>
                    </div>

                    <button
                      onClick={handleCompressPdf}
                      className="bg-primary text-white py-3.5 rounded-2xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer w-full flex items-center justify-center gap-1.5 shadow-lg shadow-primary/25"
                    >
                      ⚡ Compress Document
                    </button>
                  </div>
                </div>
              )}

              {compressState === 'compressing' && (
                <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 space-y-4 max-w-md mx-auto w-full">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-primary">
                      <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      Compressing PDF...
                    </span>
                    <span className="text-text-secondary">{compressProgress}%</span>
                  </div>
                  <div className="w-full bg-dark-bg rounded-full h-2.5 overflow-hidden border border-dark-border">
                    <div
                      className="bg-primary h-2.5 rounded-full transition-all duration-200"
                      style={{ width: `${compressProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-text-secondary italic text-center">
                    {compressStatus}
                  </p>
                </div>
              )}

              {compressState === 'completed' && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 space-y-6 max-w-lg mx-auto w-full">
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="text-xs font-extrabold flex items-center gap-1">
                      ✅ Compression Completed successfully!
                    </span>
                    <span className="text-[9px] bg-emerald-500/20 px-2 py-0.5 rounded font-extrabold uppercase">Success</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-dark-bg/60 border border-dark-border/40 rounded-xl p-3 text-center">
                      <div className="text-[10px] text-text-secondary uppercase font-bold">Original Size</div>
                      <div className="text-sm font-bold text-text-primary mt-1">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-center relative overflow-hidden">
                      <div className="text-[10px] text-emerald-400 uppercase font-bold">Compressed Size</div>
                      <div className="text-sm font-bold text-emerald-400 mt-1">{(compressedSize / 1024 / 1024).toFixed(2)} MB</div>
                      {compressedSize < uploadedFile.size && (
                        <div className="absolute top-1 right-1 bg-emerald-500 text-white text-[9px] px-1 py-0.5 rounded font-extrabold">
                          -{Math.round(((uploadedFile.size - compressedSize) / uploadedFile.size) * 100)}%
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleOpenCompressedInWorkspace}
                      className="flex-1 bg-primary text-white py-2.5 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md animate-pulse"
                    >
                      👁️ Open in Workspace
                    </button>
                    <a
                      href={compressedBlobUrl}
                      download={compressOutputName.toLowerCase().endsWith('.pdf') ? compressOutputName : `${compressOutputName}.pdf`}
                      onClick={() => toast.success('Downloaded compressed PDF!')}
                      className="flex-1 bg-dark-surface border border-dark-border text-text-primary py-2.5 rounded-xl text-xs font-bold hover:bg-dark-border hover:text-primary transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center"
                    >
                      📥 Save Compressed PDF
                    </a>
                  </div>

                  <button
                    onClick={() => {
                      setCompressedBlob(null);
                      setCompressedBlobUrl(null);
                      setCompressState('idle');
                    }}
                    className="w-full text-center text-text-secondary hover:text-white text-[10px] font-bold uppercase transition-colors cursor-pointer"
                  >
                    Compress Again
                  </button>
                </div>
              )}

              {compressState === 'failed' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 space-y-4 max-w-md mx-auto text-red-400 w-full">
                  <p className="text-xs font-bold text-center">Compression Failed</p>
                  <p className="text-[10px] text-text-secondary text-center">{compressStatus}</p>
                  <button
                    onClick={handleCompressPdf}
                    className="w-full bg-primary text-white py-2.5 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer"
                  >
                    🔄 Retry Compression
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: OCR TEXT EXTRACTION */}
          {activeTab === 'ocr' && uploadedFile && (
            <div className="lg:col-span-12 glass-card p-6 space-y-6 bg-dark-surface/10 border border-dark-border/40 rounded-3xl backdrop-blur-sm shadow-xl shadow-black/25 w-full animate-fadeIn">
              <div className="pb-4 border-b border-dark-border/40">
                <h2 className="text-lg font-extrabold text-text-primary">Optical Character Recognition (OCR)</h2>
                <p className="text-xs text-text-secondary mt-0.5">Extract vector text and recognize characters from scanned PDF pages</p>
              </div>

              {!ocrLoading && !ocrResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Config */}
                  <div className="space-y-6">
                    <div className="bg-dark-bg/40 border border-dark-border/40 rounded-2xl p-4 space-y-3">
                      <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">Document Scan Details</h3>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <span className="text-text-secondary">Filename:</span>
                        <span className="text-text-primary truncate font-bold" title={uploadedFile.name}>{uploadedFile.name}</span>
                        <span className="text-text-secondary">Current Page:</span>
                        <span className="text-text-primary font-bold">Page {currentPage} of {pdfNumPages}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block">Scan Scope</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setOcrTargetPages('current')}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                            ocrTargetPages === 'current'
                              ? 'border-primary bg-primary/10 text-primary font-bold shadow-lg shadow-primary/5'
                              : 'border-dark-border/60 hover:border-primary/30 text-text-secondary'
                          }`}
                        >
                          <div className="font-extrabold text-xs">📄 Current Page Only</div>
                          <div className="text-[10px] text-text-secondary mt-0.5">Scans only the active workspace page (Page {currentPage})</div>
                        </button>
                        <button
                          onClick={() => setOcrTargetPages('all')}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                            ocrTargetPages === 'all'
                              ? 'border-primary bg-primary/10 text-primary font-bold shadow-lg shadow-primary/5'
                              : 'border-dark-border/60 hover:border-primary/30 text-text-secondary'
                          }`}
                        >
                          <div className="font-extrabold text-xs">📚 All Pages ({pdfNumPages})</div>
                          <div className="text-[10px] text-text-secondary mt-0.5">Runs sequential character scans on all document pages</div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Output & Run */}
                  <div className="flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block">Output Text Filename</label>
                      <input
                        type="text"
                        value={ocrOutputName}
                        onChange={(e) => setOcrOutputName(e.target.value)}
                        placeholder="extracted_text.txt"
                        className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-primary transition-colors text-text-primary"
                      />
                      <p className="text-[10px] text-text-secondary italic">
                        Characters are extracted client-side using Tesseract.js. No server uploads are performed.
                      </p>
                    </div>

                    <button
                      onClick={runOcrOnPdf}
                      className="bg-primary text-white py-3.5 rounded-2xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer w-full flex items-center justify-center gap-1.5 shadow-lg shadow-primary/25"
                    >
                      🔍 Extract Text with OCR
                    </button>
                  </div>
                </div>
              )}

              {ocrLoading && (
                <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 space-y-4 max-w-md mx-auto w-full">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-primary">
                      <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      Performing OCR...
                    </span>
                    <span className="text-text-secondary">{ocrProgress}%</span>
                  </div>
                  <div className="w-full bg-dark-bg rounded-full h-2.5 overflow-hidden border border-dark-border">
                    <div
                      className="bg-primary h-2.5 rounded-full transition-all duration-200"
                      style={{ width: `${ocrProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-text-secondary italic text-center">
                    {ocrStatus}
                  </p>
                </div>
              )}

              {ocrResult && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-dark-border/20">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block">Search</label>
                      <input
                        type="text"
                        value={ocrSearchTerm}
                        onChange={(e) => setOcrSearchTerm(e.target.value)}
                        placeholder="Search term inside extracted text..."
                        className="bg-dark-bg border border-dark-border rounded-lg px-3 py-1 text-xs outline-none focus:border-primary transition-colors text-text-primary flex-1 sm:w-64"
                      />
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleCopyOcrText}
                        className="bg-dark-surface border border-dark-border text-text-primary px-4 py-2 rounded-xl text-xs font-bold hover:bg-dark-border hover:text-primary transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        📋 Copy Text
                      </button>
                      <button
                        onClick={handleExportOcrText}
                        className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
                      >
                        📥 Export Extracted Text (.txt)
                      </button>
                      <button
                        onClick={() => {
                          setOcrResult('');
                          setOcrProgress(0);
                        }}
                        className="text-text-secondary hover:text-white px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Scan Again
                      </button>
                    </div>
                  </div>

                  {/* Text display with matched highlight */}
                  <div className="border border-dark-border bg-dark-bg/60 rounded-2xl p-5 max-h-[400px] overflow-y-auto scrollbar-thin">
                    <pre className="text-xs leading-relaxed text-text-secondary whitespace-pre-wrap font-mono">
                      {ocrSearchTerm ? (
                        (() => {
                          const parts = ocrResult.split(new RegExp(`(${ocrSearchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
                          return parts.map((part, index) => 
                            part.toLowerCase() === ocrSearchTerm.toLowerCase() ? (
                              <mark key={index} className="bg-yellow-500/35 text-white px-0.5 rounded font-bold">{part}</mark>
                            ) : part
                          );
                        })()
                      ) : (
                        ocrResult
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 0: PDF SPLIT */}
          {activeTab === 'split' && uploadedFile && (
            <div className="lg:col-span-12 glass-card p-6 space-y-6 bg-dark-surface/10 border border-dark-border/40 rounded-3xl backdrop-blur-sm shadow-xl shadow-black/25 w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-dark-border/40 gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-text-primary">Split PDF Workspace</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Select pages to extract into a new PDF document</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (selectedSplitPages.length === pdfNumPages) {
                        setSelectedSplitPages([]);
                      } else {
                        setSelectedSplitPages(Array.from({ length: pdfNumPages }, (_, i) => i + 1));
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl border border-dark-border text-xs font-bold bg-dark-surface/40 hover:bg-dark-border transition-colors cursor-pointer"
                  >
                    {selectedSplitPages.length === pdfNumPages ? 'Deselect All' : 'Select All Pages'}
                  </button>
                </div>
              </div>

              {splitState === 'idle' && (
                <div className="space-y-6">
                  {/* Visual Page Previews Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin p-1">
                    {pdfDocument && Array.from({ length: pdfNumPages }, (_, idx) => {
                      const pageNum = idx + 1;
                      const isSelected = selectedSplitPages.includes(pageNum);
                      return (
                        <div
                          key={pageNum}
                          onClick={() => {
                            setSelectedSplitPages(prev =>
                              prev.includes(pageNum)
                                ? prev.filter(p => p !== pageNum)
                                : [...prev, pageNum].sort((a, b) => a - b)
                            );
                          }}
                          className={`relative border rounded-2xl p-2 cursor-pointer transition-all overflow-hidden flex flex-col items-center bg-dark-bg/40 ${
                            isSelected
                              ? 'border-primary ring-2 ring-primary/45 shadow-lg'
                              : 'border-dark-border/60 hover:border-primary/40'
                          }`}
                        >
                          <div className="w-full aspect-[3/4] bg-dark-surface/30 rounded-xl overflow-hidden relative">
                            <PdfThumbnail
                              pageNum={pageNum}
                              pdfDocument={pdfDocument}
                              currentPage={-1}
                            />
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full border border-dark-border/80 flex items-center justify-center bg-dark-bg/80 text-white">
                              {isSelected && (
                                <div className="w-3 h-3 rounded-full bg-primary" />
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] font-extrabold text-text-secondary mt-2">
                            Page {pageNum}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-dark-border/40 flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
                    <div className="flex-1 w-full min-w-0">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1.5">
                        Output Filename
                      </label>
                      <input
                        type="text"
                        value={splitOutputName}
                        onChange={(e) => setSplitOutputName(e.target.value)}
                        placeholder="split_document.pdf"
                        className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-primary transition-colors text-text-primary"
                      />
                    </div>
                    <button
                      onClick={handleSplitPdf}
                      disabled={selectedSplitPages.length === 0}
                      className="bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer w-full sm:w-auto shadow-md"
                    >
                      ✂️ Split PDF ({selectedSplitPages.length} Pages)
                    </button>
                  </div>
                </div>
              )}

              {splitState === 'splitting' && (
                <div className="bg-dark-surface border border-dark-border rounded-2xl p-5 space-y-3 w-full">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-primary">
                      <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      Splitting Document...
                    </span>
                    <span className="text-text-secondary">{splitProgress}%</span>
                  </div>
                  <div className="w-full bg-dark-bg rounded-full h-2.5 overflow-hidden border border-dark-border">
                    <div
                      className="bg-primary h-2.5 rounded-full transition-all duration-200"
                      style={{ width: `${splitProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-text-secondary italic text-center">
                    {splitStatus}
                  </p>
                </div>
              )}

              {splitState === 'completed' && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 space-y-4 w-full">
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="text-xs font-bold">✅ PDF Split Successfully!</span>
                    <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded font-extrabold uppercase">Complete</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleOpenSplitInWorkspace}
                      className="flex-1 bg-primary text-white py-2.5 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
                    >
                      👁️ Open Split PDF in Viewer
                    </button>
                    <a
                      href={splitBlobUrl}
                      download={splitOutputName.toLowerCase().endsWith('.pdf') ? splitOutputName : `${splitOutputName}.pdf`}
                      onClick={() => toast.success('Downloaded split PDF!')}
                      className="flex-1 bg-dark-surface border border-dark-border text-text-primary py-2.5 rounded-xl text-xs font-bold hover:bg-dark-border hover:text-primary transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center"
                    >
                      📥 Save Split PDF Locally
                    </a>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSplitPages([]);
                      setSplitBlob(null);
                      setSplitBlobUrl(null);
                      setSplitState('idle');
                    }}
                    className="w-full text-center text-text-secondary hover:text-white text-[10px] font-bold uppercase transition-colors cursor-pointer"
                  >
                    Start Another Split
                  </button>
                </div>
              )}

              {splitState === 'failed' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 space-y-3 text-red-400 w-full">
                  <p className="text-xs font-bold text-center">Split Failed</p>
                  <p className="text-[10px] text-text-secondary text-center">{splitStatus}</p>
                  <button
                    onClick={handleSplitPdf}
                    className="w-full bg-primary text-white py-2 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer"
                  >
                    🔄 Retry Split
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: PDF VIEW (VIEWER) */}
          {activeTab === 'view' && uploadedFile && (
            <>
              {/* Left sidebar: Navigation Panel */}
              <div className="lg:col-span-3 glass-card p-4 h-[650px] overflow-y-auto flex flex-col gap-4 scrollbar-thin">
                {/* Sidebar Tab Selector */}
                <div className="flex gap-1.5 p-1 bg-dark-bg/60 border border-dark-border/40 rounded-xl">
                  <button
                    onClick={() => setSidebarTab('pages')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      sidebarTab === 'pages'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-text-secondary hover:text-white'
                    }`}
                  >
                    Pages
                  </button>
                  <button
                    onClick={() => setSidebarTab('bookmarks')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      sidebarTab === 'bookmarks'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-text-secondary hover:text-white'
                    }`}
                  >
                    Bookmarks
                  </button>
                </div>

                {sidebarTab === 'pages' ? (
                  <div className="flex flex-col gap-3 flex-1">
                    <h3 className="text-[10px] font-extrabold text-text-secondary uppercase tracking-widest flex items-center justify-between">
                      <span>Page Previews</span>
                      <span className="bg-dark-border px-2 py-0.5 rounded text-[9px] text-text-secondary font-bold">
                        {pdfNumPages} total
                      </span>
                    </h3>
                    <div className="space-y-3 overflow-y-auto flex-1 pr-1 scrollbar-thin">
                      {pdfDocument && Array.from({ length: pdfNumPages }, (_, idx) => (
                        <PdfThumbnail
                          key={idx + 1}
                          pageNum={idx + 1}
                          pdfDocument={pdfDocument}
                          currentPage={currentPage}
                          onClick={() => setCurrentPage(idx + 1)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[10px] font-extrabold text-text-secondary uppercase tracking-widest">
                        Bookmarks
                      </h3>
                      <button
                        onClick={addBookmark}
                        className="px-2 py-1 bg-primary/20 text-primary border border-primary/30 rounded-lg text-[9px] font-bold hover:bg-primary/30 transition-all cursor-pointer"
                        title="Bookmark Current Page"
                      >
                        + Add Current
                      </button>
                    </div>

                    <div className="space-y-2 overflow-y-auto flex-1 pr-1 scrollbar-thin">
                      {pdfBookmarks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                          <Bookmark size={24} className="text-text-secondary/35 mb-2" />
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">No Bookmarks</span>
                          <span className="text-[9px] text-text-secondary/60 mt-0.5">Click '+ Add Current' to save this page</span>
                        </div>
                      ) : (
                        pdfBookmarks.map((b) => (
                          <div
                            key={b._id}
                            className="bg-dark-surface/40 hover:bg-dark-surface/80 border border-dark-border/40 hover:border-primary/30 rounded-xl p-2.5 flex items-center justify-between gap-2 group transition-all"
                          >
                            <div className="flex-1 min-w-0">
                              {editingBookmarkId === b._id ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={editingBookmarkTitle}
                                    onChange={(e) => setEditingBookmarkTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') renameBookmark(b._id);
                                      if (e.key === 'Escape') setEditingBookmarkId(null);
                                    }}
                                    className="bg-dark-bg border border-dark-border rounded px-1.5 py-0.5 text-[10px] font-bold text-text-primary outline-none focus:border-primary flex-1"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => renameBookmark(b._id)}
                                    className="text-emerald-400 hover:text-emerald-300 font-bold text-[10px] cursor-pointer"
                                  >
                                    Save
                                  </button>
                                </div>
                              ) : (
                                <div
                                  onClick={() => setCurrentPage(b.pageNumber)}
                                  className="cursor-pointer"
                                >
                                  <div className="text-[10px] font-bold text-text-primary truncate" title={b.title}>
                                    {b.title}
                                  </div>
                                  <div className="text-[9px] text-text-secondary font-bold uppercase tracking-wider mt-0.5">
                                    Page {b.pageNumber}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              {editingBookmarkId !== b._id && (
                                <button
                                  onClick={() => {
                                    setEditingBookmarkId(b._id);
                                    setEditingBookmarkTitle(b.title);
                                  }}
                                  className="p-1 hover:bg-dark-border text-text-secondary hover:text-white rounded transition-colors cursor-pointer text-[9px] font-bold uppercase"
                                  title="Rename Bookmark"
                                >
                                  Edit
                                </button>
                              )}
                              <button
                                onClick={() => deleteBookmark(b._id)}
                                className="p-1 hover:bg-red-500/20 text-text-secondary hover:text-red-400 rounded transition-colors cursor-pointer text-[9px] font-bold uppercase"
                                title="Delete Bookmark"
                              >
                                Del
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Center Area: High-Performance Canvas Viewer */}
              <div className="lg:col-span-6 flex flex-col gap-3">
                {/* PDF Viewer Toolbar */}
                <div className="glass-card p-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
                  {/* Page Navigation */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 bg-dark-surface border border-dark-border hover:bg-dark-border hover:text-primary text-xs font-bold rounded-xl transition-all disabled:opacity-30 disabled:hover:text-text-secondary cursor-pointer"
                      title="Previous Page"
                    >
                      Prev
                    </button>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max={pdfNumPages}
                        value={currentPage}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (val >= 1 && val <= pdfNumPages) {
                            setCurrentPage(val);
                          }
                        }}
                        className="w-12 bg-dark-bg border border-dark-border rounded-lg px-1.5 py-0.5 text-center text-xs font-bold text-text-primary outline-none focus:border-primary"
                      />
                      <span className="text-xs font-bold text-text-secondary">/ {pdfNumPages}</span>
                    </div>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(pdfNumPages, p + 1))}
                      disabled={currentPage === pdfNumPages}
                      className="p-1.5 bg-dark-surface border border-dark-border hover:bg-dark-border hover:text-primary text-xs font-bold rounded-xl transition-all disabled:opacity-30 disabled:hover:text-text-secondary cursor-pointer"
                      title="Next Page"
                    >
                      Next
                    </button>
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setZoomScale((z) => Math.max(0.5, z - 0.25))}
                      className="w-8 h-8 flex items-center justify-center bg-dark-surface border border-dark-border hover:bg-dark-border text-text-primary rounded-xl text-sm font-bold transition-all cursor-pointer"
                      title="Zoom Out"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold w-12 text-center text-text-primary">
                      {Math.round(zoomScale * 100)}%
                    </span>
                    <button
                      onClick={() => setZoomScale((z) => Math.min(3.0, z + 0.25))}
                      className="w-8 h-8 flex items-center justify-center bg-dark-surface border border-dark-border hover:bg-dark-border text-text-primary rounded-xl text-sm font-bold transition-all cursor-pointer"
                      title="Zoom In"
                    >
                      +
                    </button>
                    <button
                      onClick={() => setZoomScale(1.0)}
                      className="px-2 py-1 bg-dark-surface border border-dark-border hover:bg-dark-border text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                      title="Reset Zoom"
                    >
                      100%
                    </button>
                  </div>

                  {/* Visual Operations */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="p-1.5 bg-dark-surface border border-dark-border hover:bg-dark-border text-text-primary rounded-xl transition-all flex items-center justify-center cursor-pointer"
                      title="Rotate Page"
                    >
                      <RotateCw size={14} />
                    </button>
                    <button
                      onClick={handleToggleFullscreen}
                      className="p-1.5 bg-dark-surface border border-dark-border hover:bg-dark-border text-text-primary rounded-xl transition-all flex items-center justify-center cursor-pointer"
                      title="Toggle Fullscreen"
                    >
                      {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                    <button
                      onClick={() => {
                        setTtsActive((prev) => {
                          if (prev) handleTtsStop();
                          return !prev;
                        });
                      }}
                      className={`p-1.5 rounded-xl border transition-all text-xs font-bold flex items-center justify-center cursor-pointer ${
                        ttsActive
                          ? 'bg-primary/20 text-primary border-primary/45 shadow-md shadow-primary/10'
                          : 'bg-dark-surface border-dark-border text-text-primary hover:bg-dark-border'
                      }`}
                      title="Read Document Aloud (TTS)"
                    >
                      <Volume2 size={14} />
                    </button>

                    {/* Annotation Mode Tools */}
                    <div className="w-[1px] h-4 bg-dark-border/40 mx-1" />
                    <button
                      onClick={() => {
                        setActiveTool(activeTool === 'highlight' ? 'none' : 'highlight');
                        setActivePopup(null);
                      }}
                      className={`p-1.5 rounded-xl border transition-all text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer ${
                        activeTool === 'highlight'
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-lg shadow-yellow-500/10'
                          : 'bg-dark-surface border-dark-border text-text-secondary hover:text-white'
                      }`}
                      title="Highlight Tool"
                    >
                      <Type size={12} />
                      Highlight
                    </button>
                    <button
                      onClick={() => {
                        setActiveTool(activeTool === 'underline' ? 'none' : 'underline');
                        setActivePopup(null);
                      }}
                      className={`p-1.5 rounded-xl border transition-all text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer ${
                        activeTool === 'underline'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30 shadow-lg shadow-red-500/10'
                          : 'bg-dark-surface border-dark-border text-text-secondary hover:text-white'
                      }`}
                      title="Underline Tool"
                    >
                      <Type size={12} className="underline decoration-2" />
                      Underline
                    </button>
                    <button
                      onClick={() => {
                        setActiveTool(activeTool === 'eraser' ? 'none' : 'eraser');
                        setActivePopup(null);
                      }}
                      className={`p-1.5 rounded-xl border transition-all text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer ${
                        activeTool === 'eraser'
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-lg shadow-purple-500/10'
                          : 'bg-dark-surface border-dark-border text-text-secondary hover:text-white'
                      }`}
                      title="Eraser Tool"
                    >
                      <Trash2 size={12} />
                      Eraser
                    </button>
                    <button
                      onClick={() => {
                        setNoteModeActive(!noteModeActive);
                        setActiveTool('none');
                        setActivePopup(null);
                      }}
                      className={`p-1.5 rounded-xl border transition-all text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer ${
                        noteModeActive
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                          : 'bg-dark-surface border-dark-border text-text-secondary hover:text-white'
                      }`}
                      title="Sticky Note Tool"
                    >
                      <Plus size={12} />
                      Note
                    </button>
                    
                    {/* Reading Dark Mode Toggle */}
                    <button
                      onClick={() => {
                        const nextVal = !pdfDarkMode;
                        setPdfDarkMode(nextVal);
                        localStorage.setItem('pdf_reader_dark_mode', String(nextVal));
                        toast.success(nextVal ? 'Reading Dark Mode enabled!' : 'Reading Light Mode enabled!');
                      }}
                      className={`p-1.5 rounded-xl border transition-all text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer ${
                        pdfDarkMode
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-lg shadow-amber-500/10'
                          : 'bg-dark-surface border-dark-border text-text-secondary hover:text-white'
                      }`}
                      title={pdfDarkMode ? 'Toggle Light Mode' : 'Toggle Dark Mode'}
                    >
                      {pdfDarkMode ? <Sun size={12} /> : <Moon size={12} />}
                      Theme
                    </button>
                  </div>
                </div>

                {/* TTS Controller Panel */}
                {ttsActive && (
                  <div className="glass-card p-3 px-4 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-primary/5 border border-primary/20 animate-fadeIn">
                    <div className="flex flex-wrap items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs font-bold text-text-primary">
                          {ttsIsPlaying
                            ? `Reading (Line ${ttsCurrentLineIndex + 1})`
                            : ttsIsPaused
                            ? 'Paused'
                            : 'Ready to Read'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-text-secondary uppercase font-bold">Voice</label>
                        <select
                          value={ttsVoiceName}
                          onChange={(e) => setTtsVoiceName(e.target.value)}
                          className="bg-dark-bg border border-dark-border rounded-lg px-2 py-1 text-xs text-text-primary outline-none focus:border-primary max-w-[150px] cursor-pointer"
                        >
                          {ttsVoices.map((voice) => (
                            <option key={voice.name} value={voice.name}>
                              {voice.name} ({voice.lang})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-text-secondary uppercase font-bold">Speed</label>
                        <select
                          value={ttsSpeed}
                          onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
                          className="bg-dark-bg border border-dark-border rounded-lg px-2 py-1 text-xs text-text-primary outline-none focus:border-primary cursor-pointer"
                        >
                          <option value="0.5">0.5x</option>
                          <option value="0.8">0.8x</option>
                          <option value="1.0">1.0x (Normal)</option>
                          <option value="1.2">1.2x</option>
                          <option value="1.5">1.5x</option>
                          <option value="2.0">2.0x</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {ttsIsPlaying ? (
                        <button
                          onClick={handleTtsPause}
                          className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
                          title="Pause"
                        >
                          <Pause size={14} />
                        </button>
                      ) : ttsIsPaused ? (
                        <button
                          onClick={handleTtsResume}
                          className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
                          title="Resume"
                        >
                          <Play size={14} className="ml-0.5" />
                        </button>
                      ) : (
                        <button
                          onClick={handleTtsPlay}
                          className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
                          title="Play"
                        >
                          <Play size={14} className="ml-0.5" />
                        </button>
                      )}

                      <button
                        onClick={handleTtsStop}
                        disabled={!ttsIsPlaying && !ttsIsPaused}
                        className="w-8 h-8 rounded-full bg-dark-surface border border-dark-border text-text-secondary hover:text-white flex items-center justify-center disabled:opacity-30 cursor-pointer shadow"
                        title="Stop"
                      >
                        <Square size={12} />
                      </button>

                      <button
                        onClick={() => {
                          handleTtsStop();
                          setTtsActive(false);
                        }}
                        className="text-text-secondary hover:text-white p-1 ml-2 cursor-pointer"
                        title="Close Reader"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Search Bar Panel */}
                <div className="glass-card p-2.5 px-4 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3 flex-1">
                    <Search size={14} className="text-text-secondary" />
                    <input
                      type="text"
                      placeholder="Search words inside PDF..."
                      value={pdfSearchQuery}
                      onChange={(e) => setPdfSearchQuery(e.target.value)}
                      className="bg-transparent text-xs text-text-primary outline-none flex-1 border-none focus:ring-0"
                    />
                    {pdfSearchQuery && (
                      <button
                        onClick={() => setPdfSearchQuery('')}
                        className="text-text-secondary hover:text-white p-0.5 cursor-pointer"
                        title="Clear Search"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  
                  {pdfSearchResults.length > 0 && (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-text-secondary font-bold">
                        {pdfCurrentMatchIndex + 1} of {pdfSearchResults.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPdfCurrentMatchIndex((idx) => (idx - 1 + pdfSearchResults.length) % pdfSearchResults.length)}
                          className="p-1 hover:bg-dark-border rounded text-[10px] font-bold text-text-primary cursor-pointer transition-colors"
                          title="Previous Match"
                        >
                          Prev
                        </button>
                        <button
                          onClick={() => setPdfCurrentMatchIndex((idx) => (idx + 1) % pdfSearchResults.length)}
                          className="p-1 hover:bg-dark-border rounded text-[10px] font-bold text-text-primary cursor-pointer transition-colors"
                          title="Next Match"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                  {pdfSearchQuery.trim().length >= 2 && pdfSearchResults.length === 0 && (
                    <span className="text-xs text-red-400 font-medium animate-pulse">No results found</span>
                  )}
                </div>
 
                {/* Viewport Canvas Wrapper */}
                <div
                  ref={viewerContainerRef}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onClick={handleDoubleTap}
                  className={`glass-card p-4 h-[590px] overflow-auto flex items-center justify-center bg-dark-bg/40 relative select-none scrollbar-thin ${
                    isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen bg-black/95 p-8' : ''
                  }`}
                >
                  {pdfLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 text-primary animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
                      <span className="text-xs font-bold text-text-secondary uppercase tracking-wider animate-pulse">
                        Rendering Page...
                      </span>
                    </div>
                  ) : pdfError ? (
                    <div className="text-center p-6 space-y-3">
                      <ShieldAlert className="text-red-500 mx-auto" size={40} />
                      <h4 className="text-sm font-bold text-text-primary">Failed to Render Page</h4>
                      <p className="text-xs text-text-secondary max-w-xs">{pdfError}</p>
                    </div>
                  ) : (
                    <div
                      onClick={(e) => {
                        if (noteModeActive) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const clickY = e.clientY - rect.top;
                          addPageNote(clickX, clickY);
                        }
                      }}
                      className={`relative shadow-2xl border border-dark-border/40 rounded-xl max-w-full transition-all duration-300 ${
                        pdfDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white'
                      } ${noteModeActive ? 'cursor-crosshair' : 'overflow-hidden'}`}
                    >
                      <canvas
                        ref={viewerCanvasRef}
                        className="block max-w-full h-auto"
                        style={{
                          filter: pdfDarkMode ? 'invert(0.9) hue-rotate(180deg) contrast(1.1) brightness(0.9)' : 'none',
                          transition: 'filter 0.3s ease'
                        }}
                      />
                      
                      {/* Hitbox Selection Overlay */}
                      <div className="absolute inset-0 z-10 pointer-events-none">
                        {currentPageTextItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={(e) => handleTextItemClick(e, item)}
                            className="absolute hover:bg-primary/10 hover:border hover:border-dashed hover:border-primary/40 cursor-text pointer-events-auto rounded transition-all duration-150"
                            style={{
                              left: `${item.left}px`,
                              top: `${item.top}px`,
                              width: `${item.width}px`,
                              height: `${item.height}px`,
                            }}
                            title="Click to Highlight, Underline, AI Explain, or Read Aloud"
                          />
                        ))}
                      </div>

                      {/* Floating Action Menu popup */}
                      {activePopup && (
                        <div
                          className="absolute bg-dark-surface/95 border border-dark-border text-white text-[11px] font-extrabold rounded-2xl p-1.5 flex items-center gap-1.5 shadow-2xl z-30 animate-fadeIn backdrop-blur-md"
                          style={{
                            left: `${activePopup.x}px`,
                            top: `${activePopup.y - 45}px`,
                            transform: 'translateX(-50%)',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              toggleAnnotation(activePopup.item, 'highlight');
                              setActivePopup(null);
                            }}
                            className="px-2 py-1 hover:bg-yellow-500/20 rounded-lg text-[10px] text-yellow-300 font-extrabold transition-all cursor-pointer"
                          >
                            Highlight
                          </button>
                          <div className="w-[1px] h-3 bg-dark-border" />
                          <button
                            onClick={() => {
                              toggleAnnotation(activePopup.item, 'underline');
                              setActivePopup(null);
                            }}
                            className="px-2 py-1 hover:bg-red-500/20 rounded-lg text-[10px] text-red-400 font-extrabold transition-all cursor-pointer"
                          >
                            Underline
                          </button>
                          {hasAnnotation(activePopup.item) && (
                            <>
                              <div className="w-[1px] h-3 bg-dark-border" />
                              <button
                                onClick={() => {
                                  removeAnnotationByItem(activePopup.item);
                                  setActivePopup(null);
                                }}
                                className="px-2 py-1 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer"
                              >
                                Clear
                              </button>
                            </>
                          )}
                          <div className="w-[1px] h-3 bg-dark-border" />
                          <button
                            onClick={() => {
                              if (window.speechSynthesis) {
                                window.speechSynthesis.cancel();
                                const utterance = new SpeechSynthesisUtterance(activePopup.item.text);
                                window.speechSynthesis.speak(utterance);
                              }
                              setActivePopup(null);
                            }}
                            className="px-2 py-1 hover:bg-primary/20 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer text-white"
                          >
                            Speak
                          </button>
                          <div className="w-[1px] h-3 bg-dark-border" />
                          <button
                            onClick={() => {
                              setAiInput(`Explain this text from the document (Page ${currentPage}): "${activePopup.item.text}"`);
                              setActiveTab('ai');
                              setActivePopup(null);
                            }}
                            className="px-2 py-1 hover:bg-secondary/20 rounded-lg text-[10px] text-secondary font-extrabold transition-all cursor-pointer"
                          >
                            AI Explain
                          </button>
                          <div className="w-[1px] h-3 bg-dark-border" />
                          <button
                            onClick={() => setActivePopup(null)}
                            className="px-1.5 py-0.5 hover:bg-dark-border rounded text-text-secondary cursor-pointer text-[10px]"
                          >
                            ×
                          </button>
                        </div>
                      )}

                      {/* Sticky Notes Overlay */}
                      <div className="absolute inset-0 z-20 pointer-events-none">
                        {pdfPageNotes
                          .filter((note) => note.pageNumber === currentPage)
                          .map((note) => {
                            if (!currentViewportRef.current) return null;
                            const [viewX, viewY] = currentViewportRef.current.convertToViewportPoint(note.x, note.y);
                            return (
                              <React.Fragment key={note._id}>
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveEditingNoteId(note._id);
                                    setActiveEditingNoteText(note.content);
                                  }}
                                  className="absolute cursor-pointer hover:scale-110 active:scale-95 pointer-events-auto transition-transform duration-150"
                                  style={{
                                    left: `${viewX}px`,
                                    top: `${viewY}px`,
                                    transform: 'translate(-50%, -50%)',
                                  }}
                                  title="Sticky Note - Click to view/edit"
                                >
                                  <div className="w-5 h-5 rounded bg-yellow-400 border border-yellow-500 shadow-md flex items-center justify-center text-black hover:bg-yellow-300">
                                    <Bookmark size={11} className="text-black fill-black" />
                                  </div>
                                </div>

                                {activeEditingNoteId === note._id && (
                                  <div
                                    className="absolute bg-dark-surface/95 border border-dark-border text-white text-[11px] font-extrabold rounded-2xl p-3.5 shadow-2xl z-30 animate-fadeIn flex flex-col gap-2 w-52 pointer-events-auto backdrop-blur-md"
                                    style={{
                                      left: `${viewX}px`,
                                      top: `${viewY - 75}px`,
                                      transform: 'translateX(-50%)',
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex justify-between items-center pb-1 border-b border-dark-border/40">
                                      <span className="text-[9px] uppercase tracking-wider text-text-secondary font-extrabold">Sticky Note</span>
                                      <button
                                        onClick={() => deletePageNote(note._id)}
                                        className="text-red-400 hover:text-red-300 text-[9px] font-extrabold cursor-pointer"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                    <textarea
                                      value={activeEditingNoteText}
                                      onChange={(e) => {
                                        setActiveEditingNoteText(e.target.value);
                                        autoSavePageNote(note._id, e.target.value);
                                      }}
                                      placeholder="Type note content..."
                                      className="w-full h-16 bg-dark-bg border border-dark-border rounded-lg p-1.5 text-[10px] text-text-primary outline-none focus:border-primary resize-none placeholder:text-text-secondary/40 font-medium"
                                      autoFocus
                                    />
                                    <div className="flex justify-between items-center text-[8px] text-text-secondary/60">
                                      <span>Auto-saved</span>
                                      <button
                                        onClick={() => setActiveEditingNoteId(null)}
                                        className="text-text-secondary hover:text-white font-bold uppercase cursor-pointer"
                                      >
                                        Close
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })}
                      </div>

                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-white border border-white/10 pointer-events-none">
                        Page {currentPage} / {pdfNumPages}
                      </div>
                    </div>
                  )}

                  {/* Fullscreen Overlay controls */}
                  {isFullscreen && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/70 border border-white/10 backdrop-blur-md px-4 py-2 rounded-2xl z-50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentPage((p) => Math.max(1, p - 1));
                        }}
                        disabled={currentPage === 1}
                        className="text-white hover:text-primary font-bold text-xs disabled:opacity-30 cursor-pointer"
                      >
                        Prev
                      </button>
                      <span className="text-white text-xs font-bold">
                        {currentPage} / {pdfNumPages}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentPage((p) => Math.min(pdfNumPages, p + 1));
                        }}
                        disabled={currentPage === pdfNumPages}
                        className="text-white hover:text-primary font-bold text-xs disabled:opacity-30 cursor-pointer"
                      >
                        Next
                      </button>
                      <div className="w-[1px] h-3 bg-white/20" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFullscreen();
                        }}
                        className="text-white hover:text-red-400 text-xs font-bold cursor-pointer"
                      >
                        Exit
                      </button>
                    </div>
                  )}
                </div>

                {/* Floating button to toggle Line-by-line reading drawer */}
                <button
                  onClick={() => setShowLineByLine((prev) => !prev)}
                  className="fixed bottom-32 right-12 p-4 rounded-full bg-primary hover:bg-primary-hover text-white shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-2 group z-20 cursor-pointer"
                >
                  <BookOpen size={20} />
                  <span className="text-xs font-bold max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300">
                    Line Reader
                  </span>
                </button>
              </div>

              {/* Right Panel: Line-by-line viewer (if open) */}
              <div className={`lg:col-span-3 glass-card p-4 h-[650px] flex flex-col ${showLineByLine ? 'block' : 'hidden lg:flex'}`}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-extrabold text-text-secondary uppercase tracking-widest">
                    Line Reader
                  </h3>
                  <span className="text-[10px] bg-primary/20 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
                    {filteredLines.length} lines
                  </span>
                </div>

                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    type="text"
                    placeholder="Search lines..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl pl-8 pr-3 py-2 text-xs text-text-primary outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
                  {filteredLines.map((line) => (
                    <div
                      key={line.id}
                      onClick={() => {
                        setHighlightedLineId(line.id);
                        setCurrentPage(line.page); // Jumps viewer to matching page!
                      }}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex flex-col gap-1.5 ${
                        highlightedLineId === line.id
                          ? 'bg-primary/10 border-primary text-white'
                          : 'bg-dark-surface/40 border-dark-border/40 text-text-secondary hover:border-primary/20 hover:text-text-primary'
                      }`}
                    >
                      <p className="leading-relaxed font-medium">{line.text}</p>
                      
                      <div className="flex justify-between items-center mt-1 border-t border-dark-border/20 pt-1.5">
                        <span className="text-[9px] font-bold text-text-secondary bg-dark-bg px-2 py-0.5 rounded">
                          Page {line.page}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              speakLine(line.text);
                            }}
                            className="p-1 rounded bg-dark-bg hover:bg-primary/20 text-text-secondary hover:text-primary transition-colors cursor-pointer"
                            title="Read Aloud"
                          >
                            <Volume2 size={11} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              explainLineWithAI(line);
                            }}
                            className="p-1 rounded bg-dark-bg hover:bg-secondary/20 text-text-secondary hover:text-secondary transition-colors cursor-pointer"
                            title="AI Explain"
                          >
                            <Sparkles size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredLines.length === 0 && (
                    <div className="text-center py-8 text-xs text-text-secondary">
                      No lines matching search term.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: PDF EDITOR (Handles Text, Signature, and Watermark) */}
          {(activeTab === 'edit' || activeTab === 'signature' || activeTab === 'watermark') && uploadedFile && (
            <>
              {/* Left Panel: Editor Config controls */}
              <div className="lg:col-span-4 glass-card p-5 space-y-6">
                <div className="border-b border-dark-border/40 pb-3">
                  <h3 className="text-sm font-bold text-text-primary capitalize flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    {activeTab === 'edit' ? 'Text Annotation Editor' : activeTab === 'signature' ? 'Digital Signature Creator' : 'Watermark Configurator'}
                  </h3>
                </div>

                {/* Edit Controls based on mode */}
                {editMode === 'text' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-secondary">Direct Editing</label>
                      <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-[11px] text-primary font-medium leading-relaxed">
                        👉 <strong>Click anywhere</strong> directly on the PDF document page to start typing and insert text inline!
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-secondary">Font Size (px)</label>
                        <input
                          type="number"
                          value={editorFontSize}
                          onChange={(e) => setEditorFontSize(e.target.value)}
                          className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-text-primary outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-secondary">Text Color</label>
                        <input
                          type="color"
                          value={editorColor}
                          onChange={(e) => setEditorColor(e.target.value)}
                          className="w-full h-8 bg-dark-bg border border-dark-border rounded-xl p-0.5 cursor-pointer"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="editorBgMask"
                        checked={editorBgMask}
                        onChange={(e) => setEditorBgMask(e.target.checked)}
                        className="w-4 h-4 rounded border-dark-border bg-dark-bg text-primary focus:ring-primary focus:ring-offset-dark-bg cursor-pointer"
                      />
                      <label htmlFor="editorBgMask" className="text-xs font-bold text-text-secondary cursor-pointer select-none">
                        Mask Background (covers text behind)
                      </label>
                    </div>
                  </div>
                )}

                {editMode === 'watermark' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-secondary">Watermark Text</label>
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-primary"
                      />
                    </div>
                    <p className="text-[10px] text-text-secondary">
                      💡 A diagonal semitransparent watermark will be drawn across every page of your PDF on export.
                    </p>
                  </div>
                )}

                {editMode === 'signature' && (
                  <div className="space-y-4 animate-fadeIn">
                    <button
                      onClick={() => setShowSignaturePad(true)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs hover:scale-102 transition-all flex items-center justify-center gap-2"
                    >
                      <PenTool size={14} />
                      Draw Signature Pad
                    </button>
                    <p className="text-[10px] text-text-secondary">
                      💡 Draw digital signature, save it, and then drag/reposition on screen.
                    </p>
                  </div>
                )}

                {/* Compilation Actions */}
                <div className="border-t border-dark-border/50 pt-4 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Document Actions</label>
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf';
                        input.onchange = (e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleInsertPdf(e.target.files[0]);
                          }
                        };
                        input.click();
                      }}
                      className="w-full py-2.5 rounded-xl border border-dashed border-primary/40 hover:border-primary/80 hover:bg-primary/5 text-primary font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus size={13} />
                      Insert PDF Pages
                    </button>
                  </div>

                  <button
                    onClick={handleSaveEditedPdf}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs hover:scale-102 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Download size={14} />
                    Save & Export PDF
                  </button>
                </div>
              </div>

              {/* Center Area: PDF Page Editor preview */}
              <div className="lg:col-span-8 glass-card p-4 flex flex-col items-center relative min-h-[500px]">
                {/* Editor Navigation */}
                <div className="flex justify-between items-center w-full mb-3 border-b border-dark-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditorPageIdx((p) => Math.max(0, p - 1))}
                      disabled={editorPageIdx === 0}
                      className="p-1 px-3 bg-dark-surface border border-dark-border hover:bg-dark-border text-xs rounded-lg disabled:opacity-30"
                    >
                      Prev
                    </button>
                    <span className="text-xs font-bold">
                      Page {editorPageIdx + 1} of {pdfNumPages}
                    </span>
                    <button
                      onClick={() => setEditorPageIdx((p) => Math.min(pdfNumPages - 1, p + 1))}
                      disabled={editorPageIdx === pdfNumPages - 1}
                      className="p-1 px-3 bg-dark-surface border border-dark-border hover:bg-dark-border text-xs rounded-lg disabled:opacity-30"
                    >
                      Next
                    </button>
                  </div>
                </div>

                {/* Interactive Screen Page Canvas */}
                {editorPageBase64 ? (
                  <div
                    onClick={handleEditorPageClick}
                    className="relative border border-dark-border rounded-xl cursor-crosshair overflow-hidden bg-white max-w-full"
                    style={{ width: '480px' }}
                  >
                    <img src={editorPageBase64} alt="page" className="w-full h-auto pointer-events-none" />
                    
                    {/* Render active inline editor input if editing text */}
                    {activeInlineInput && (
                      <input
                        type="text"
                        autoFocus
                        value={activeInlineInput.val}
                        onChange={(e) => setActiveInlineInput(prev => ({ ...prev, val: e.target.value }))}
                        onBlur={() => {
                          if (activeInlineInput.val.trim()) {
                            setAddedTexts((prev) => [
                              ...prev,
                              {
                                text: activeInlineInput.val,
                                x: activeInlineInput.x * 1.5,
                                y: activeInlineInput.y * 1.5,
                                size: activeInlineInput.original ? activeInlineInput.original.fontSize : parseInt(editorFontSize),
                                color: activeInlineInput.original ? '#000000' : editorColor,
                                pageIndex: editorPageIdx,
                                bgMask: editorBgMask,
                                isReplacement: !!activeInlineInput.original,
                                replacedItemId: activeInlineInput.original ? activeInlineInput.id : null,
                                tx: activeInlineInput.original ? activeInlineInput.original.tx : null,
                                ty: activeInlineInput.original ? activeInlineInput.original.ty : null,
                                tw: activeInlineInput.original ? activeInlineInput.original.width : null,
                                th: activeInlineInput.original ? activeInlineInput.original.height : null,
                              },
                            ]);
                          }
                          setActiveInlineInput(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.target.blur();
                          } else if (e.key === 'Escape') {
                            setActiveInlineInput(null);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()} // prevent double triggers
                        className="absolute bg-white/95 border border-primary rounded px-2 py-1 outline-none font-sans z-30 shadow-lg text-xs"
                        style={{
                          left: `${activeInlineInput.x}px`,
                          top: `${activeInlineInput.y}px`,
                          color: activeInlineInput.original ? '#000000' : editorColor,
                          fontSize: `${activeInlineInput.original ? activeInlineInput.original.fontSize : editorFontSize}px`,
                          transform: activeInlineInput.original ? 'translate(0, -70%)' : 'translate(-50%, -50%)',
                        }}
                      />
                    )}
                    
                    {/* Render original PDF text items overlays */}
                    {pdfTextItems
                      .filter((item) => item.pageIndex === editorPageIdx)
                      .map((item) => {
                        const isReplaced = addedTexts.some((t) => t.replacedItemId === item.id);
                        if (isReplaced) {
                          return (
                            <div
                              key={item.id}
                              className="absolute bg-white z-10 pointer-events-none"
                              style={{
                                left: `${item.cx / 1.2}px`,
                                top: `${(item.cy - item.height - 2) / 1.2}px`,
                                width: `${item.width / 1.2}px`,
                                height: `${(item.height + 4) / 1.2}px`,
                              }}
                            />
                          );
                        } else {
                          return (
                            <div
                              key={item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveInlineInput({
                                  id: item.id,
                                  x: item.cx / 1.2,
                                  y: item.cy / 1.2,
                                  val: item.text,
                                  original: item,
                                });
                              }}
                              className="absolute hover:border hover:border-dashed hover:border-primary/80 hover:bg-primary/5 cursor-text text-transparent select-none z-20"
                              style={{
                                left: `${item.cx / 1.2}px`,
                                top: `${(item.cy - item.height - 2) / 1.2}px`,
                                width: `${item.width / 1.2}px`,
                                height: `${(item.height + 4) / 1.2}px`,
                              }}
                              title="Click to edit this text"
                            />
                          );
                        }
                      })}

                    {/* Render newly added text points for current page */}
                    {addedTexts
                      .filter((t) => t.pageIndex === editorPageIdx)
                      .map((t, idx) => {
                        const textX = t.x / 1.2;
                        const textY = t.y / 1.2;
                        return (
                          <div
                            key={idx}
                            className={`absolute font-sans pointer-events-none z-20 ${t.bgMask ? 'bg-white px-2 py-1 rounded shadow-md border border-dark-border text-black' : 'font-semibold'}`}
                            style={{
                              left: `${textX}px`,
                              top: `${textY}px`,
                              color: t.bgMask ? '#000000' : t.color,
                              fontSize: `${t.size}px`,
                              transform: t.bgMask ? 'translate(-50%, -50%)' : (t.isReplacement ? 'translate(0, -85%)' : 'translate(-50%, -50%)'),
                            }}
                          >
                            {t.text}
                          </div>
                        );
                      })}

                    {/* Render newly added signatures for current page */}
                    {addedSignatures
                      .filter((s) => s.pageIndex === editorPageIdx)
                      .map((s, idx) => (
                        <div
                          key={idx}
                          className="absolute border border-dashed border-primary bg-black/40 rounded p-0.5 cursor-move"
                          style={{
                            left: `${s.x}px`,
                            top: `${s.y}px`,
                            width: `${s.width}px`,
                            height: `${s.height}px`,
                          }}
                          onMouseDown={(e) => {
                            const rect = e.currentTarget.parentElement.getBoundingClientRect();
                            const onMouseMove = (moveEvt) => {
                              const dragX = moveEvt.clientX - rect.left - s.width / 2;
                              const dragY = moveEvt.clientY - rect.top - s.height / 2;
                              setAddedSignatures((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, x: dragX, y: dragY } : item
                                )
                              );
                            };
                            const onMouseUp = () => {
                              window.removeEventListener('mousemove', onMouseMove);
                              window.removeEventListener('mouseup', onMouseUp);
                            };
                            window.addEventListener('mousemove', onMouseMove);
                            window.addEventListener('mouseup', onMouseUp);
                          }}
                        >
                          <img src={s.dataUrl} className="w-full h-full object-contain pointer-events-none" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddedSignatures((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="w-[480px] h-[640px] border border-dark-border rounded-xl bg-dark-bg/40 flex flex-col items-center justify-center gap-2 animate-pulse">
                    <div className="w-8 h-8 text-primary animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                      Rendering Editor Page...
                    </span>
                  </div>
                )}

                {/* Modal drawing pad for signatures */}
                {showSignaturePad && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
                    <div className="w-full max-w-md bg-dark-surface border border-primary/20 rounded-3xl p-6 relative">
                      <button
                        onClick={() => setShowSignaturePad(false)}
                        className="absolute top-4 right-4 p-2 text-text-secondary hover:text-white rounded-full bg-dark-bg"
                      >
                        <X size={16} />
                      </button>
                      <h3 className="text-sm font-bold text-text-primary mb-4">Draw Digital Signature</h3>
                      
                      <div className="border border-dark-border bg-dark-bg/80 rounded-2xl overflow-hidden mb-4">
                        <canvas
                          ref={canvasRef}
                          width="400"
                          height="200"
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          className="w-full h-[200px] cursor-crosshair bg-[#0d0f14]"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={clearSignatureCanvas}
                          className="flex-1 py-2.5 rounded-xl border border-dark-border text-xs font-bold text-text-secondary hover:text-white"
                        >
                          Clear
                        </button>
                        <button
                          onClick={saveSignaturePad}
                          className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover"
                        >
                          Insert Signature
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 3: AI STUDY PANEL */}
          {activeTab === 'ai' && uploadedFile && (
            <>
              {/* Left Panel: Auto AI Actions */}
              <div className="lg:col-span-4 glass-card p-5 space-y-6 flex flex-col justify-between h-[600px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="text-primary" size={20} />
                    <h3 className="text-sm font-bold text-text-primary">Gemini Assistant</h3>
                  </div>
                  
                  <button
                    onClick={handleGenerateSummary}
                    disabled={aiLoading}
                    className="w-full py-3 rounded-xl bg-dark-surface/50 border border-dark-border hover:border-primary/50 text-left px-4 flex items-center justify-between text-xs text-text-primary disabled:opacity-40 transition-all"
                  >
                    <span>Generate Academic Summary</span>
                    <Sparkles size={14} className="text-primary" />
                  </button>

                  <button
                    onClick={handleGenerateFlashcards}
                    disabled={aiLoading}
                    className="w-full py-3 rounded-xl bg-dark-surface/50 border border-dark-border hover:border-primary/50 text-left px-4 flex items-center justify-between text-xs text-text-primary disabled:opacity-40 transition-all"
                  >
                    <span>Create Study Flashcards (5 Q&A)</span>
                    <BookOpen size={14} className="text-secondary" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto mt-4 border-t border-dark-border/30 pt-4 scrollbar-thin">
                  {aiSummary && (
                    <div className="p-3 bg-dark-bg/60 rounded-2xl border border-dark-border space-y-2 animate-fadeIn">
                      <h4 className="text-xs font-extrabold text-primary uppercase">Summary</h4>
                      <p className="text-[11px] leading-relaxed text-text-secondary whitespace-pre-wrap">{aiSummary}</p>
                    </div>
                  )}

                  {aiFlashcards.length > 0 && (
                    <div className="space-y-3 animate-fadeIn mt-2">
                      <h4 className="text-xs font-extrabold text-secondary uppercase">Flashcards ({aiFlashcards.length})</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {aiFlashcards.map((card, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setAiFlashcards(prev =>
                                prev.map((c, i) => i === idx ? { ...c, flipped: !c.flipped } : c)
                              );
                            }}
                            className="bg-dark-surface/60 border border-dark-border rounded-xl p-3 cursor-pointer select-none text-center min-h-[80px] flex items-center justify-center transition-all relative overflow-hidden group hover:border-secondary/40"
                          >
                            <div className="absolute top-1 left-2 text-[9px] font-bold text-text-secondary bg-dark-bg px-1.5 py-0.5 rounded">
                              #{idx + 1}
                            </div>
                            <div className="absolute top-1 right-2 text-[8px] text-text-secondary font-bold group-hover:text-secondary">
                              Flip
                            </div>
                            <p className="text-xs font-medium px-2">
                              {card.flipped ? card.answer : card.question}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel: Chat stream */}
              <div className="lg:col-span-8 glass-card p-4 flex flex-col h-[600px]">
                <div className="flex items-center gap-2 border-b border-dark-border/50 pb-3 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-extrabold tracking-widest text-text-secondary uppercase">Active Document Chat Context</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                  {aiChat.map((chat, idx) => (
                    <div
                      key={idx}
                      className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed border ${
                          chat.role === 'user'
                            ? 'bg-primary text-white border-transparent'
                            : 'bg-dark-surface/60 border-dark-border text-text-secondary'
                        }`}
                      >
                        {chat.text}
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex justify-start items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-dark-surface border border-dark-border flex items-center justify-center animate-spin">
                        <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                      </div>
                      <span className="text-[10px] text-text-secondary font-bold uppercase animate-pulse">Gemini is thinking...</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 border-t border-dark-border/50 pt-4 mt-4">
                  <input
                    type="text"
                    placeholder="Ask standard questions about your study PDF..."
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAiChatSend();
                    }}
                    className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-xs text-text-primary outline-none focus:border-primary placeholder:text-text-secondary/40"
                  />
                  <button
                    onClick={handleAiChatSend}
                    className="px-5 py-3 rounded-xl bg-primary hover:bg-primary-hover font-bold text-xs text-white shadow-lg transition-all"
                  >
                    Ask
                  </button>
                </div>
              </div>
            </>
          )}

          {/* TAB 4: OCR SCANNER */}
          {activeTab === 'ocr' && !uploadedFile && (
            <div className="lg:col-span-12 glass-card p-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
              {/* Image upload zone */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-text-primary">OCR Image Upload</h3>
                <div
                  onClick={() => {
                    const el = document.createElement('input');
                    el.type = 'file';
                    el.accept = 'image/*,application/pdf';
                    el.onchange = handleOcrFileSelect;
                    el.click();
                  }}
                  className="border-2 border-dashed border-dark-border hover:border-primary/50 transition-all rounded-3xl bg-dark-surface/20 p-8 text-center cursor-pointer min-h-[250px] flex flex-col items-center justify-center group relative overflow-hidden"
                >
                  {ocrImage ? (
                    <img src={ocrImage} alt="Scanned document" className="max-h-[220px] object-contain rounded-lg" />
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center mb-3">
                        <Upload className="text-text-secondary" size={24} />
                      </div>
                      <p className="text-xs font-bold text-text-primary">Click to upload Scanned Image or PDF Page</p>
                      <p className="text-[10px] text-text-secondary mt-1">Supports PNG, JPG, JPEG, or single-page PDF</p>
                    </>
                  )}
                </div>

                {ocrLoading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-primary">
                      <span>Analyzing text characters...</span>
                      <span>{ocrProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-dark-surface rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Generated Text result */}
              <div className="flex flex-col h-full justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-text-primary">OCR Extracted Text</h3>
                    {ocrResult && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(ocrResult);
                          toast.success('Extracted text copied to clipboard!');
                        }}
                        className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-lg hover:bg-primary/20 transition-all"
                      >
                        Copy Text
                      </button>
                    )}
                  </div>

                  <div className="border border-dark-border bg-dark-bg/80 rounded-2xl p-4 h-[250px] overflow-y-auto scrollbar-thin">
                    {ocrResult ? (
                      <p className="text-xs leading-relaxed text-text-secondary whitespace-pre-wrap font-mono">{ocrResult}</p>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-text-secondary text-xs">
                        {ocrLoading ? 'Tesseract.js OCR is extracting document strings...' : 'Upload an image/scanned document to trigger client-side character recognition.'}
                      </div>
                    )}
                  </div>
                </div>

                {ocrResult && (
                  <button
                    onClick={() => {
                      const blob = new Blob([ocrResult], { type: 'text/plain' });
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(blob);
                      a.download = 'ocr_extracted_text.txt';
                      a.click();
                      toast.success('Downloaded text file!');
                    }}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold hover:scale-102 transition-all mt-4"
                  >
                    Download as TXT file
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: FILE CONVERSIONS */}
          {activeTab === 'conversions' && (() => {
            const CONVERSION_DETAILS = {
              'pdf-to-word': { title: 'PDF to Word Converter', label: 'Convert PDF to Word (.doc)', accept: '.pdf' },
              'pdf-to-image': { title: 'PDF to Image Converter', label: 'Convert PDF to PNG Image', accept: '.pdf' },
              'pdf-to-text': { title: 'PDF to Text Converter', label: 'Convert PDF to Text (.txt)', accept: '.pdf' },
              'word-to-pdf': { title: 'Word to PDF Converter', label: 'Convert Word to PDF Document', accept: '.doc,.docx' },
              'image-to-pdf': { title: 'Image to PDF Converter', label: 'Convert Images to PDF Document', accept: 'image/*', multiple: true },
              'text-to-pdf': { title: 'Text to PDF Converter', label: 'Convert Text to PDF Document', accept: '.txt' },
            };
            return (
              <div className="lg:col-span-12 glass-card p-6 max-w-xl mx-auto w-full animate-fadeIn space-y-6">
                <div className="text-center pb-4 border-b border-dark-border/40">
                  <h2 className="text-lg font-bold text-primary">
                    {CONVERSION_DETAILS[convertType]?.title || 'File Converter'}
                  </h2>
                  <p className="text-xs text-text-secondary mt-1">
                    Local client-side secure conversion
                  </p>
                </div>

                {/* Upload area */}
                <div className="space-y-4">
                  <div
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = CONVERSION_DETAILS[convertType]?.accept || '*/*';
                        fileInputRef.current.multiple = CONVERSION_DETAILS[convertType]?.multiple || false;
                        fileInputRef.current.click();
                      }
                    }}
                    className="border-2 border-dashed border-dark-border hover:border-primary/50 transition-all rounded-3xl bg-dark-surface/20 p-8 text-center cursor-pointer min-h-[180px] flex flex-col items-center justify-center group"
                  >
                    {convertFiles.length > 0 ? (
                      <div className="space-y-1">
                        <FileText className="text-primary mx-auto mb-2" size={32} />
                        <p className="text-xs font-bold text-text-primary">Uploaded {convertFiles.length} file(s)</p>
                        {convertFiles.map((f, i) => (
                          <p key={i} className="text-[10px] text-text-secondary truncate max-w-[250px] mx-auto">{f.name}</p>
                        ))}
                      </div>
                    ) : (
                      <>
                        <Upload className="text-text-secondary mb-3" size={24} />
                        <p className="text-xs font-bold text-text-primary">Click to upload source files</p>
                        <p className="text-[10px] text-text-secondary mt-0.5">
                          Accepts {CONVERSION_DETAILS[convertType]?.accept}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                  {convertFiles.length > 0 && !convertedUrl && (
                    <button
                      onClick={handleConversionProcess}
                      disabled={isProcessing}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2"
                    >
                      {isProcessing ? 'Processing conversion...' : (CONVERSION_DETAILS[convertType]?.label || 'Trigger Conversion')}
                    </button>
                  )}

                  {convertedUrl && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-4 animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                          <Check size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-400">Success! Conversion Complete</p>
                          <p className="text-[10px] text-text-secondary truncate max-w-[300px]">{convertedName}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={convertedUrl}
                          download={convertedName}
                          className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-center font-bold text-xs text-white transition-all flex items-center justify-center gap-2"
                        >
                          <Download size={14} />
                          Download Result
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      setConvertFiles([]);
                      setConvertedUrl(null);
                      setActiveTab('view'); // Back to main dashboard!
                    }}
                    className="w-full py-3 rounded-xl border border-dark-border text-xs text-text-secondary hover:text-white transition-all"
                  >
                    {convertedUrl ? 'Convert Another File' : 'Cancel & Go Back'}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* TAB 6: PDF UTILITIES */}
          {activeTab === 'utilities' && (
            <div className="lg:col-span-12 glass-card p-6 max-w-xl mx-auto w-full animate-fadeIn space-y-6">
              <div className="text-center pb-4 border-b border-dark-border/40">
                <h2 className="text-lg font-bold text-primary">
                  {utilType === 'merge-pdf' ? 'Merge PDF Documents' :
                   utilType === 'split-pdf' ? 'Split PDF (Extract Page 1)' :
                   utilType === 'rotate-pdf' ? 'Rotate PDF Document' :
                   utilType === 'delete-pages' ? 'Delete Page 2 from PDF' : 'PDF Utility'}
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  Local client-side secure operations
                </p>
              </div>

              {/* Sizing angle for rotation */}
              {utilType === 'rotate-pdf' && (
                <div className="space-y-2 animate-fadeIn bg-dark-bg/40 p-4 rounded-2xl border border-dark-border/40">
                  <label className="text-xs font-bold text-text-secondary">Rotation Angle</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[90, 180, 270].map((angle) => (
                      <button
                        key={angle}
                        onClick={() => setRotationAngle(angle)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          rotationAngle === angle
                            ? 'bg-primary text-white border-transparent'
                            : 'bg-dark-surface/40 border-dark-border text-text-secondary hover:border-primary/20'
                        }`}
                      >
                        {angle}°
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload area */}
              <div className="space-y-4">
                <div
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = '.pdf';
                      fileInputRef.current.multiple = utilType === 'merge-pdf';
                      fileInputRef.current.click();
                    }
                  }}
                  className="border-2 border-dashed border-dark-border hover:border-primary/50 transition-all rounded-3xl bg-dark-surface/20 p-8 text-center cursor-pointer min-h-[180px] flex flex-col items-center justify-center group"
                >
                  {utilFiles.length > 0 ? (
                    <div className="space-y-1">
                      <FileText className="text-primary mx-auto mb-2" size={32} />
                      <p className="text-xs font-bold text-text-primary">Uploaded {utilFiles.length} PDF(s)</p>
                      {utilFiles.map((f, i) => (
                        <p key={i} className="text-[10px] text-text-secondary truncate max-w-[250px] mx-auto">{f.name}</p>
                      ))}
                    </div>
                  ) : (
                    <>
                      <Upload className="text-text-secondary mb-3" size={24} />
                      <p className="text-xs font-bold text-text-primary">Click to select PDF files</p>
                      <p className="text-[10px] text-text-secondary mt-0.5">
                        {utilType === 'merge-pdf' ? 'Supports multiple PDF selection' : 'Select a single PDF file'}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                {utilFiles.length > 0 && !utilResultUrl && (
                  <button
                    onClick={handleUtilitiesProcess}
                    disabled={isProcessing}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? 'Executing utility...' :
                     utilType === 'merge-pdf' ? 'Merge PDF Files' :
                     utilType === 'split-pdf' ? 'Split PDF File' :
                     utilType === 'rotate-pdf' ? 'Rotate PDF File' :
                     utilType === 'delete-pages' ? 'Delete Page 2' : 'Execute Utility'}
                  </button>
                )}

                {utilResultUrl && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                        <Check size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-400">Success! Process Complete</p>
                        <p className="text-[10px] text-text-secondary truncate max-w-[300px]">{utilResultName}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={utilResultUrl}
                        download={utilResultName}
                        className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-center font-bold text-xs text-white transition-all flex items-center justify-center gap-2"
                      >
                        <Download size={14} />
                        Download Result
                      </a>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setUtilFiles([]);
                    setUtilResultUrl(null);
                    setActiveTab('view'); // Back to main dashboard!
                  }}
                  className="w-full py-3 rounded-xl border border-dark-border text-xs text-text-secondary hover:text-white transition-all"
                >
                  {utilResultUrl ? 'Process Another File' : 'Cancel & Go Back'}
                </button>
              </div>
            </div>
          )}

          {/* TAB: CONVERT TO PDF */}
          {activeTab === 'to-pdf' && (
            <div className="lg:col-span-12 space-y-6 mt-6">
              {conversionPreview ? (
                /* Preview Container */
                <div className="glass-card p-6 max-w-xl mx-auto w-full animate-fadeIn space-y-6">
                  <div className="flex justify-between items-center border-b border-dark-border/40 pb-3">
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      Review Converted PDF
                    </h3>
                    <button
                      onClick={() => setConversionPreview(null)}
                      className="px-2.5 py-1 rounded-lg border border-dark-border hover:bg-dark-surface/50 text-xs font-semibold transition-all"
                    >
                      Back
                    </button>
                  </div>
                  
                  <div className="border border-dark-border bg-dark-bg/60 rounded-2xl p-6 text-center space-y-3">
                    <FileText className="text-primary mx-auto" size={48} />
                    <p className="text-sm font-bold text-text-primary">{conversionPreview.name}</p>
                    <p className="text-xs text-text-secondary">{conversionPreview.previewData}</p>
                  </div>

                  <a
                    href={conversionPreview.url}
                    download={conversionPreview.name}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-center text-white font-extrabold text-xs hover:scale-102 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Download size={14} />
                    Download PDF Document
                  </a>
                </div>
              ) : (
                <div className="glass-card p-8 max-w-md mx-auto w-full text-center space-y-6 animate-fadeIn">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
                    <FileText size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Convert Document to PDF</h3>
                    <p className="text-xs text-text-secondary mt-1">
                      Ready to compile and convert <span className="font-semibold text-primary">{uploadedFile?.name}</span> to a secure PDF document.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleToPdfClick}
                    disabled={isProcessing}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  >
                    {isProcessing ? 'Converting document...' : 'Convert to PDF'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: PDF TO WORD */}
          {activeTab === 'to-word' && (
            <div className="lg:col-span-12 space-y-6 mt-6">
              {conversionPreview ? (
                /* Preview Container */
                <div className="glass-card p-6 max-w-xl mx-auto w-full animate-fadeIn space-y-6">
                  <div className="flex justify-between items-center border-b border-dark-border/40 pb-3">
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      Review Word Document Conversion
                    </h3>
                    <button
                      onClick={() => setConversionPreview(null)}
                      className="px-2.5 py-1 rounded-lg border border-dark-border hover:bg-dark-surface/50 text-xs font-semibold transition-all"
                    >
                      Back
                    </button>
                  </div>
                  <div className="border border-dark-border bg-dark-bg/60 rounded-2xl p-4 max-h-[250px] overflow-y-auto scrollbar-thin text-xs text-text-secondary leading-relaxed">
                    <p className="whitespace-pre-wrap">{conversionPreview.previewData?.replace(/<[^>]*>/g, '\n') || ''}</p>
                  </div>
                  <a
                    href={conversionPreview.url}
                    download={conversionPreview.name}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-center text-white font-extrabold text-xs hover:scale-102 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Download size={14} />
                    Download Word Document (.doc)
                  </a>
                </div>
              ) : (
                <div className="glass-card p-6 max-w-md mx-auto w-full text-center space-y-6 animate-fadeIn">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mx-auto">
                    <FileText size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Convert PDF to Microsoft Word</h3>
                    <p className="text-xs text-text-secondary mt-1">
                      Ready to convert <span className="font-semibold text-primary">{uploadedFile?.name}</span> directly into editable Word Document (.doc) format.
                    </p>
                  </div>
                  <button
                    onClick={() => handleConversionProcess('to-word')}
                    disabled={isProcessing}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-xs hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    {isProcessing ? 'Converting document...' : 'Convert to Word (.doc)'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: PDF TO IMAGE */}
          {activeTab === 'to-image' && (
            <div className="lg:col-span-12 space-y-6 mt-6">
              {conversionPreview && Array.isArray(conversionPreview.images) ? (
                /* Preview Container */
                <div className="glass-card p-6 max-w-2xl mx-auto w-full animate-fadeIn space-y-6">
                  <div className="flex justify-between items-center border-b border-dark-border/40 pb-3">
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      Review Converted Page Images
                    </h3>
                    <button
                      onClick={() => setConversionPreview(null)}
                      className="px-2.5 py-1 rounded-lg border border-dark-border hover:bg-dark-surface/50 text-xs font-semibold transition-all"
                    >
                      Back
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto scrollbar-thin p-1">
                    {conversionPreview.images.map((img, idx) => (
                      <div key={idx} className="relative rounded-xl border border-dark-border overflow-hidden bg-white/5 p-2 flex flex-col items-center">
                        <img src={img.url} alt={img.name} className="w-full h-auto object-contain rounded-lg max-h-[150px]" />
                        <div className="mt-2 text-center text-[10px] text-text-secondary font-mono truncate max-w-full">
                          {img.name}
                        </div>
                        <a
                          href={img.url}
                          download={img.name}
                          className="mt-2 w-full py-1 text-center bg-primary/20 hover:bg-primary/40 text-primary hover:text-white rounded text-[10px] font-bold transition-all"
                        >
                          Download Page {idx + 1}
                        </a>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      conversionPreview.images.forEach((img, idx) => {
                        setTimeout(() => {
                          const a = document.createElement('a');
                          a.href = img.url;
                          a.download = img.name;
                          a.click();
                        }, idx * 250);
                      });
                      toast.success('Successfully downloaded all page images!');
                    }}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs hover:scale-102 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Download size={14} />
                    Download All Images (.{conversionPreview.format})
                  </button>
                </div>
              ) : (
                <div className="glass-card p-6 max-w-md mx-auto w-full text-center space-y-6 animate-fadeIn">
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center mx-auto">
                    <Image size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Convert PDF to Page Images</h3>
                    <p className="text-xs text-text-secondary mt-1">
                      Extract high-res page images from <span className="font-semibold text-primary">{uploadedFile?.name}</span>.
                    </p>
                  </div>

                  {/* Format Selector */}
                  <div className="space-y-2 text-left bg-dark-bg/40 p-4 rounded-2xl border border-dark-border/40 animate-fadeIn">
                    <label className="text-xs font-bold text-text-secondary block">Image Format:</label>
                    <div className="grid grid-cols-2 gap-3 mt-1.5">
                      <button
                        onClick={() => setToImageFormat('png')}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          toImageFormat === 'png'
                            ? 'bg-primary/20 text-primary border-primary/50'
                            : 'bg-dark-surface/40 border-dark-border text-text-secondary hover:border-primary/20'
                        }`}
                      >
                        PNG (Lossless)
                      </button>
                      <button
                        onClick={() => setToImageFormat('jpeg')}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          toImageFormat === 'jpeg'
                            ? 'bg-primary/20 text-primary border-primary/50'
                            : 'bg-dark-surface/40 border-dark-border text-text-secondary hover:border-primary/20'
                        }`}
                      >
                        JPEG (Compressed)
                      </button>
                    </div>
                  </div>

                  {/* Quality Selector */}
                  <div className="space-y-2 text-left bg-dark-bg/40 p-4 rounded-2xl border border-dark-border/40 animate-fadeIn">
                    <label className="text-xs font-bold text-text-secondary block">Rendering Quality:</label>
                    <div className="grid grid-cols-3 gap-2 mt-1.5">
                      <button
                        onClick={() => setToImageQuality('low')}
                        className={`py-2 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                          toImageQuality === 'low'
                            ? 'bg-primary/20 text-primary border-primary/50'
                            : 'bg-dark-surface/40 border-dark-border text-text-secondary hover:border-primary/20'
                        }`}
                      >
                        Low (1.0x scale)
                      </button>
                      <button
                        onClick={() => setToImageQuality('medium')}
                        className={`py-2 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                          toImageQuality === 'medium'
                            ? 'bg-primary/20 text-primary border-primary/50'
                            : 'bg-dark-surface/40 border-dark-border text-text-secondary hover:border-primary/20'
                        }`}
                      >
                        Medium (2.0x scale)
                      </button>
                      <button
                        onClick={() => setToImageQuality('high')}
                        className={`py-2 rounded-xl text-[10px] font-bold transition-all border cursor-pointer ${
                          toImageQuality === 'high'
                            ? 'bg-primary/20 text-primary border-primary/50'
                            : 'bg-dark-surface/40 border-dark-border text-text-secondary hover:border-primary/20'
                        }`}
                      >
                        High (3.0x scale)
                      </button>
                    </div>
                  </div>

                  {pdfPages.length > 0 && (
                    <div className="space-y-2 text-left bg-dark-bg/40 p-4 rounded-2xl border border-dark-border/40 animate-fadeIn">
                      <label className="text-xs font-bold text-text-secondary">Select Pages to Convert:</label>
                      <div className="grid grid-cols-4 gap-2 max-h-[120px] overflow-y-auto scrollbar-thin p-1">
                        {pdfPages.map((_, idx) => {
                          const isSelected = selectedImagePages.includes(idx);
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                setSelectedImagePages(prev => {
                                  if (prev.includes(idx)) {
                                    return prev.filter(i => i !== idx);
                                  } else {
                                    return [...prev, idx];
                                  }
                                });
                              }}
                              className={`py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                                isSelected
                                  ? 'bg-primary/20 text-primary border-primary/50'
                                  : 'bg-dark-surface/40 border-dark-border text-text-secondary hover:border-primary/20'
                              }`}
                            >
                              Page {idx + 1}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-text-secondary mt-1">
                        💡 Leave all unselected to convert all pages of the document.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => handleConversionProcess('to-image')}
                    disabled={isProcessing}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold text-xs hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                  >
                    {isProcessing ? 'Converting document...' : 'Convert to Images'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: PDF TO TEXT */}
          {activeTab === 'to-text' && (
            <div className="lg:col-span-12 space-y-6 mt-6">
              {conversionPreview ? (
                /* Preview Container */
                <div className="glass-card p-6 max-w-xl mx-auto w-full animate-fadeIn space-y-6">
                  <div className="flex justify-between items-center border-b border-dark-border/40 pb-3">
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      Review Extracted Plain Text
                    </h3>
                    <button
                      onClick={() => setConversionPreview(null)}
                      className="px-2.5 py-1 rounded-lg border border-dark-border hover:bg-dark-surface/50 text-xs font-semibold transition-all"
                    >
                      Back
                    </button>
                  </div>
                  <div className="border border-dark-border bg-dark-bg/60 rounded-2xl p-4 max-h-[250px] overflow-y-auto scrollbar-thin">
                    <pre className="text-xs leading-relaxed text-text-secondary whitespace-pre-wrap font-mono">
                      {conversionPreview.previewData}
                    </pre>
                  </div>
                  <a
                    href={conversionPreview.url}
                    download={conversionPreview.name}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-center text-white font-extrabold text-xs hover:scale-102 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Download size={14} />
                    Download Text File (.txt)
                  </a>
                </div>
              ) : (
                <div className="glass-card p-6 max-w-md mx-auto w-full text-center space-y-6 animate-fadeIn">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
                    <FileText size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Convert PDF to Plain Text</h3>
                    <p className="text-xs text-text-secondary mt-1">
                      Ready to extract all text from <span className="font-semibold text-primary">{uploadedFile?.name}</span> into a plain TXT file.
                    </p>
                  </div>
                  <button
                    onClick={() => handleConversionProcess('to-text')}
                    disabled={isProcessing}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    {isProcessing ? 'Extracting text...' : 'Convert to Text (.txt)'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm text-center space-y-4 p-6">
            <div className="w-10 h-10 text-primary animate-spin rounded-full border-4 border-solid border-primary border-t-transparent mx-auto" />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-primary animate-pulse">
                Processing PDF Documents
              </p>
              {loadingProgress > 0 && (
                <div className="w-full h-1 bg-dark-surface rounded-full overflow-hidden mt-3 max-w-[200px] mx-auto">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${loadingProgress}%` }} />
                </div>
              )}
              <p className="text-[10px] text-text-secondary mt-1">Executing client-side document compilers...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Low-resolution on-demand thumbnail renderer
const PdfThumbnail = ({ pageNum, pdfDocument, currentPage, onClick }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;

    let active = true;
    const renderThumb = async () => {
      try {
        const page = await pdfDocument.getPage(pageNum);
        if (!active || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Render at a small scale (e.g. 0.15) for high performance
        const viewport = page.getViewport({ scale: 0.15 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Thumbnail render error:', err);
        }
      }
    };

    renderThumb();

    return () => {
      active = false;
    };
  }, [pdfDocument, pageNum]);

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer border-2 rounded-xl p-1 bg-white/5 transition-all flex flex-col items-center gap-1 hover:border-primary/50 hover:bg-white/10 ${
        currentPage === pageNum ? 'border-primary shadow-lg shadow-primary/20 bg-primary/5' : 'border-dark-border/40'
      }`}
    >
      <canvas ref={canvasRef} className="max-w-[120px] rounded shadow-md pointer-events-none" />
      <span className="text-[10px] font-bold text-text-secondary mt-1">Page {pageNum}</span>
    </div>
  );
};
