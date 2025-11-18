import multer from "multer";
import path from "path";
import fs from "fs";
import mime from 'mime-types';

// ============================================
// TECH PACK FILE UPLOAD CONFIGURATION
// ============================================
const techPackFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Base upload path
    let uploadPath = "public/uploads/tech-packs/";
    
    // Organize by file type
    if (file.mimetype === 'application/pdf') {
      uploadPath += "pdfs/";
    } else if (file.mimetype.startsWith('image/')) {
      uploadPath += "images/";
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath += "videos/";
    } else if (
      file.mimetype.includes('spreadsheet') || 
      file.mimetype.includes('excel') ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      uploadPath += "spreadsheets/";
    } else if (
      file.mimetype.includes('document') || 
      file.mimetype.includes('word') ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      uploadPath += "documents/";
    } else {
      uploadPath += "others/";
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    console.log(`[TechPack Upload] Destination: ${uploadPath} for file: ${file.originalname}`);
    cb(null, uploadPath);
  },
  
  filename: (req, file, cb) => {
    // Sanitize original filename
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .toLowerCase();
    
    // Get file extension
    let ext = path.extname(sanitizedName);
    
    // If no extension, try to get from mimetype
    if (!ext || ext === '.') {
      const mimeExt = mime.extension(file.mimetype);
      if (mimeExt) {
        ext = '.' + mimeExt;
      } else {
        ext = '';
      }
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.round(Math.random() * 1e9);
    const nameWithoutExt = path.basename(sanitizedName, ext);
    const filename = `${nameWithoutExt}-${timestamp}-${randomString}${ext}`;
    
    console.log(`[TechPack Upload] Generated filename: ${filename}`);
    cb(null, filename);
  },
});

// File filter to validate allowed file types
const techPackFileFilter = (req, file, cb) => {
  // Define allowed MIME types
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    
    // Spreadsheets
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    
    // Text files
    'text/plain',
    
    // Videos (optional)
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
  ];
  
  // Check if file type is allowed
  if (allowedMimeTypes.includes(file.mimetype)) {
    console.log(`[TechPack Upload] File type accepted: ${file.mimetype}`);
    return cb(null, true);
  } else {
    console.log(`[TechPack Upload] File type rejected: ${file.mimetype}`);
    const error = new Error(`File type not allowed. Received: ${file.mimetype}`);
    error.code = 'INVALID_FILE_TYPE';
    cb(error);
  }
};

// ============================================
// MULTER CONFIGURATIONS
// ============================================

// Single file upload
export const techPackSingleUpload = multer({
  storage: techPackFileStorage,
  fileFilter: techPackFileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
});

// Multiple files upload
export const techPackMultipleUpload = multer({
  storage: techPackFileStorage,
  fileFilter: techPackFileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB per file
    files: 10, // Maximum 10 files at once
  },
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Determine file category based on mimetype
export const getFileCategory = (mimetype) => {
  if (!mimetype) return 'other';
  
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (
    mimetype.includes('spreadsheet') || 
    mimetype.includes('excel') ||
    mimetype === 'application/vnd.ms-excel' ||
    mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimetype === 'text/csv'
  ) return 'spreadsheet';
  if (
    mimetype.includes('document') || 
    mimetype.includes('word') ||
    mimetype === 'application/msword' ||
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) return 'document';
  if (mimetype === 'text/plain') return 'text';
  
  return 'other';
};

// Generate file URL
export const generateFileUrl = (filePath, baseUrl) => {
  const cleanPath = filePath
    .replace(/^public[\\/]/, '')
    .replace(/\\/g, '/');
  return `${baseUrl}/${cleanPath}`;
};

// Delete file from storage
export const deleteFileFromStorage = async (filePath) => {
  try {
    // Convert URL to file system path if needed
    let fsPath = filePath;
    
    // If it's a URL, extract the path
    if (filePath.startsWith('http')) {
      const url = new URL(filePath);
      fsPath = url.pathname;
    }
    
    // Remove leading slash if present
    fsPath = fsPath.replace(/^\//, '');
    
    // Construct full path
    const fullPath = path.join(process.cwd(), 'public', fsPath);
    
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      console.log(`[TechPack Upload] File deleted: ${fullPath}`);
      return true;
    } else {
      console.log(`[TechPack Upload] File not found: ${fullPath}`);
      return false;
    }
  } catch (error) {
    console.error("[TechPack Upload] Error deleting file:", error);
    return false;
  }
};

// Error handler middleware
export const handleTechPackUploadError = (err, req, res, next) => {
  // Clean up uploaded file if there was an error
  if (req.file && req.file.path) {
    fs.unlink(req.file.path, (unlinkErr) => {
      if (unlinkErr) console.error("[TechPack Upload] Cleanup error:", unlinkErr);
    });
  }
  
  if (req.files && req.files.length > 0) {
    req.files.forEach(file => {
      fs.unlink(file.path, (unlinkErr) => {
        if (unlinkErr) console.error("[TechPack Upload] Cleanup error:", unlinkErr);
      });
    });
  }
  
  // Handle Multer errors
  if (err instanceof multer.MulterError) {
    const errorMessages = {
      'LIMIT_FILE_SIZE': 'File size exceeds the maximum limit of 15MB',
      'LIMIT_FILE_COUNT': 'Too many files. Maximum 10 files allowed',
      'LIMIT_UNEXPECTED_FILE': 'Unexpected field name',
      'LIMIT_PART_COUNT': 'Too many parts',
      'LIMIT_FIELD_KEY': 'Field name too long',
      'LIMIT_FIELD_VALUE': 'Field value too long',
      'LIMIT_FIELD_COUNT': 'Too many fields',
    };
    
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: errorMessages[err.code] || 'File upload error',
      error: err.code,
    });
  }
  
  // Handle custom errors
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: err.message,
      error: 'INVALID_FILE_TYPE',
    });
  }
  
  // Handle other errors
  if (err) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: err.message || 'File upload failed',
      error: 'UPLOAD_ERROR',
    });
  }
  
  next();
};

// Get file metadata
export const getFileMetadata = (file) => {
  return {
    originalName: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    category: getFileCategory(file.mimetype),
    uploadedAt: new Date(),
  };
};