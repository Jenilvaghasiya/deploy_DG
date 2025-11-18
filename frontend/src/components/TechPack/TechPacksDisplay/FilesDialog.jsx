// TechPacksDisplay/FilesDialog.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Upload,
  FileText,
  Image,
  Trash2,
  Download,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import api from "@/api/axios";
import toast from "react-hot-toast";

// Constants
const FILE_CONSTRAINTS = {
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
};

const FILE_TYPE_MAP = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/jpg': 'image',
  'application/pdf': 'pdf',
};

// Utility functions
const getFileTypeFromMime = (mimeType) => {
  return FILE_TYPE_MAP[mimeType] || 'other';
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB'];
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, unitIndex)).toFixed(1);
  return `${size} ${units[unitIndex]}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Unknown date';
  }
};

// Sub-components
const FileIcon = ({ fileType }) => {
  const iconProps = useMemo(() => {
    switch (fileType) {
      case "image":
        return { Icon: Image, className: "w-5 h-5 text-blue-400" };
      case "pdf":
        return { Icon: FileText, className: "w-5 h-5 text-red-400" };
      default:
        return { Icon: FileText, className: "w-5 h-5 text-gray-400" };
    }
  }, [fileType]);

  const { Icon, className } = iconProps;
  return <Icon className={className} />;
};

const FileUploadZone = ({ onFileSelect, uploading, techPackId }) => (
  <label className="block cursor-pointer">
    <input
      type="file"
      accept={FILE_CONSTRAINTS.ALLOWED_TYPES.join(',')}
      onChange={onFileSelect}
      disabled={uploading}
      multiple
      className="hidden"
      aria-label="Upload files"
    />
    <div className={`
      border-2 border-dashed border-white/20 rounded-lg p-8 
      text-center transition-all
      ${uploading 
        ? 'opacity-50 cursor-not-allowed bg-gray-800/50' 
        : 'hover:border-white/40 hover:bg-white/5 cursor-pointer'}
    `}>
      <Upload className={`w-12 h-12 text-gray-400 mx-auto mb-3 ${uploading ? 'animate-pulse' : ''}`} />
      <p className="text-white font-medium mb-1">
        {uploading ? "Processing files..." : "Click to select files"}
      </p>
      <p className="text-gray-400 text-sm">
        Images (JPEG, PNG) or PDFs up to {FILE_CONSTRAINTS.MAX_SIZE_MB}MB
      </p>
      <p className="text-gray-500 text-xs mt-1">
        You can select multiple files at once
      </p>
      {!techPackId && (
        <p className="text-yellow-400 text-xs mt-2">
          Files will be uploaded when you save the tech pack
        </p>
      )}
    </div>
  </label>
);

const FileCard = ({ file, onDelete, canDelete, uploading }) => (
  <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4 hover:bg-white/10 transition-all group">
    <div className="flex items-start gap-3">
      <div className="mt-1">
        <FileIcon fileType={file.file_type} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate" title={file.file_name}>
          {file.file_name}
          {file.isTemp && (
            <span className="ml-2 text-xs text-yellow-400">(pending upload)</span>
          )}
        </p>
        <p className="text-gray-400 text-xs mt-1">
          {formatFileSize(file.file_size)} • {formatDate(file.uploaded_at)}
        </p>
      </div>
      
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {!file.isTemp && file.file_url && (
          <a
            href={file.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors p-1"
            title="View/Download file"
            aria-label={`Download ${file.file_name}`}
          >
            <Download className="w-4 h-4" />
          </a>
        )}
        
        {canDelete && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(file._id, file.isTemp)}
            className="text-red-400 hover:bg-red-500/20 p-1 transition-colors"
            title="Delete file"
            aria-label={`Delete ${file.file_name}`}
            disabled={uploading}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  </div>
);

const EmptyState = ({ isEditMode }) => (
  <div className="text-center py-12">
    <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
    <p className="text-gray-400">No files added yet</p>
    {isEditMode && (
      <p className="text-gray-500 text-sm mt-2">
        Click the upload area above to add files
      </p>
    )}
  </div>
);

const LoadingState = () => (
  <div className="text-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto" />
    <p className="text-gray-400 mt-4">Loading files...</p>
  </div>
);

// Main component
export default function FilesDialog({ 
  isOpen, 
  onClose, 
  techPackId, 
  isEditMode,
  onFilesSelected,
  existingFiles = []
}) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Load files when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (techPackId) {
        fetchFiles();
      } else {
        setFiles(existingFiles);
      }
    }
  }, [isOpen, techPackId, existingFiles]);

  // API calls
  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/image-variation/tech-packs/${techPackId}/files`);
      const filesData = response.data?.data?.files || [];
      
      const formattedFiles = filesData.map(file => ({
        _id: file._id,
        file_url: file.file_url,
        file_name: file.file_name,
        file_type: file.file_type || 'other',
        file_size: file.file_size || 0,
        uploaded_at: file.uploaded_at,
        uploaded_by: file.uploaded_by
      }));
      
      setFiles(formattedFiles);
    } catch (error) {
      console.error("Error fetching files:", error);
      setError("Failed to load files. Please try again.");
      toast.error("Failed to load files");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [techPackId]);

  // File validation
  const validateFile = useCallback((file) => {
    const errors = [];
    
    if (!FILE_CONSTRAINTS.ALLOWED_TYPES.includes(file.type)) {
      errors.push(`Only images (JPEG, PNG) and PDFs are allowed`);
    }
    
    if (file.size > FILE_CONSTRAINTS.MAX_SIZE_BYTES) {
      errors.push(`File size must be less than ${FILE_CONSTRAINTS.MAX_SIZE_MB}MB`);
    }
    
    return errors;
  }, []);

  // File upload handler
  const uploadFile = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(
      `/image-variation/tech-packs/${techPackId}/upload-file`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    
    return response.data?.data?.file;
  }, [techPackId]);

  // Event handlers
  const handleFileSelect = useCallback(async (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    const results = { success: 0, error: 0 };
    
    try {
      for (const file of selectedFiles) {
        // Validate file
        const validationErrors = validateFile(file);
        if (validationErrors.length > 0) {
          toast.error(`${file.name}: ${validationErrors.join(', ')}`);
          results.error++;
          continue;
        }
        
        try {
          if (techPackId && isEditMode) {
            // Upload immediately in edit mode
            const uploadedFile = await uploadFile(file);
            
            if (uploadedFile) {
              const formattedFile = {
                _id: uploadedFile._id,
                file_url: uploadedFile.file_url,
                file_name: uploadedFile.file_name,
                file_type: uploadedFile.file_type || getFileTypeFromMime(file.type),
                file_size: uploadedFile.file_size || file.size,
                uploaded_at: uploadedFile.uploaded_at || new Date().toISOString()
              };
              
              setFiles(prev => [...prev, formattedFile]);
              onFilesSelected?.(file);
              results.success++;
            }
          } else if (!techPackId) {
            // Create mode - add to local state
            onFilesSelected?.(file);
            
            const fileDisplay = {
              _id: `temp-${Date.now()}-${Math.random()}`,
              file_name: file.name,
              file_size: file.size,
              file_type: getFileTypeFromMime(file.type),
              uploaded_at: new Date().toISOString(),
              isTemp: true
            };
            
            setFiles(prev => [...prev, fileDisplay]);
            results.success++;
          }
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}`);
          results.error++;
        }
      }
      
      // Show summary
      if (results.success > 0 && results.error === 0) {
        toast.success(`Successfully added ${results.success} file(s)`);
      } else if (results.success > 0 && results.error > 0) {
        toast.success(`Added ${results.success} file(s), ${results.error} failed`);
      }
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }, [techPackId, isEditMode, onFilesSelected, validateFile, uploadFile]);

  const handleDeleteFile = useCallback(async (fileId, isTemp) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    
    if (isTemp || !techPackId) {
      setFiles(prev => prev.filter(f => f._id !== fileId));
      toast.success("File removed");
      return;
    }
    
    try {
      setUploading(true);
      await api.delete(`/image-variation/tech-packs/${techPackId}/files/${fileId}`);
      setFiles(prev => prev.filter(f => f._id !== fileId));
      toast.success("File deleted successfully");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
      await fetchFiles();
    } finally {
      setUploading(false);
    }
  }, [techPackId, fetchFiles]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className=" white max-h-[80vh] overflow-hidden flex flex-col min-w-[400px] md:min-w-[600px] lg:min-w-[700px]">
        <DialogHeader className="border-b border-white/20 p-4 flex justify-between items-center">
          <DialogTitle className="text-xl font-bold text-white">
            Tech Pack Files
          </DialogTitle>
          <DialogClose asChild>
            
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {isEditMode && (
            <div className="mb-6">
              <FileUploadZone 
                onFileSelect={handleFileSelect}
                uploading={uploading}
                techPackId={techPackId}
              />
            </div>
          )}

          {loading ? (
            <LoadingState />
          ) : files.length === 0 ? (
            <EmptyState isEditMode={isEditMode} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {files.map((file) => (
                <FileCard
                  key={file._id}
                  file={file}
                  onDelete={handleDeleteFile}
                  canDelete={isEditMode}
                  uploading={uploading}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}