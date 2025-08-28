/**
 * MediaUploader Component
 * 
 * Drag-and-drop media uploader with preview, validation, and progress tracking.
 * Supports multiple file types and provides upload feedback.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  AttachFile as AttachIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Description as FileIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';

interface MediaFile {
  file: File;
  id: string;
  preview?: string;
  uploadProgress: number;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface MediaUploaderProps {
  onFilesSelected: (files: File[]) => void;
  onUploadComplete?: (uploadedFiles: Array<{ file: File; url: string; id: string }>) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  showPreview?: boolean;
  multiple?: boolean;
  disabled?: boolean;
  variant?: 'button' | 'dropzone' | 'icon';
  children?: React.ReactNode;
}

const DEFAULT_ACCEPTED_TYPES = [
  'image/*',
  'video/*',
  'audio/*',
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.zip',
  '.rar'
];

const MediaUploader: React.FC<MediaUploaderProps> = ({
  onFilesSelected,
  onUploadComplete,
  maxFiles = 5,
  maxFileSize = 10, // 10MB
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  showPreview = true,
  multiple = true,
  disabled = false,
  variant = 'dropzone',
  children
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    // Check file type
    const isAccepted = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type.match(type.replace('*', '.*'));
    });

    if (!isAccepted) {
      return 'File type not supported';
    }

    return null;
  };

  const createPreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon />;
    if (file.type.startsWith('video/')) return <VideoIcon />;
    if (file.type.startsWith('audio/')) return <AudioIcon />;
    return <FileIcon />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelection = useCallback(async (files: File[]) => {
    setError(null);
    
    // Check total file count
    if (mediaFiles.length + files.length > maxFiles) {
      setError(`Cannot upload more than ${maxFiles} files`);
      return;
    }

    const validFiles: MediaFile[] = [];
    const invalidFiles: string[] = [];

    for (const file of files) {
      const validationError = validateFile(file);
      
      if (validationError) {
        invalidFiles.push(`${file.name}: ${validationError}`);
        continue;
      }

      const preview = await createPreview(file);
      
      validFiles.push({
        file,
        id: generateId(),
        preview,
        uploadProgress: 0,
        uploadStatus: 'pending'
      });
    }

    if (invalidFiles.length > 0) {
      setError(`Some files were rejected: ${invalidFiles.join(', ')}`);
    }

    if (validFiles.length > 0) {
      const newMediaFiles = [...mediaFiles, ...validFiles];
      setMediaFiles(newMediaFiles);
      onFilesSelected(newMediaFiles.map(mf => mf.file));
    }
  }, [mediaFiles, maxFiles, onFilesSelected]);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      handleFileSelection(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      handleFileSelection(files);
    }
  }, [handleFileSelection]);

  const handleRemoveFile = (id: string) => {
    const newMediaFiles = mediaFiles.filter(mf => mf.id !== id);
    setMediaFiles(newMediaFiles);
    onFilesSelected(newMediaFiles.map(mf => mf.file));
  };

  const simulateUpload = (mediaFile: MediaFile) => {
    setMediaFiles(prev => prev.map(mf => 
      mf.id === mediaFile.id 
        ? { ...mf, uploadStatus: 'uploading' as const }
        : mf
    ));

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      
      if (progress >= 100) {
        clearInterval(interval);
        setMediaFiles(prev => prev.map(mf => 
          mf.id === mediaFile.id 
            ? { ...mf, uploadProgress: 100, uploadStatus: 'completed' as const }
            : mf
        ));
      } else {
        setMediaFiles(prev => prev.map(mf => 
          mf.id === mediaFile.id 
            ? { ...mf, uploadProgress: Math.min(progress, 99) }
            : mf
        ));
      }
    }, 200);
  };

  const renderFileList = () => {
    if (!showPreview || mediaFiles.length === 0) return null;

    return (
      <Paper variant="outlined" sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
        <List dense>
          {mediaFiles.map((mediaFile) => (
            <ListItem key={mediaFile.id}>
              <ListItemIcon>
                {mediaFile.uploadStatus === 'completed' && <SuccessIcon color="success" />}
                {mediaFile.uploadStatus === 'error' && <ErrorIcon color="error" />}
                {mediaFile.uploadStatus === 'pending' && getFileIcon(mediaFile.file)}
                {mediaFile.uploadStatus === 'uploading' && getFileIcon(mediaFile.file)}
              </ListItemIcon>
              
              <ListItemText
                primary={mediaFile.file.name}
                secondary={
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      {formatFileSize(mediaFile.file.size)}
                    </Typography>
                    {mediaFile.uploadStatus === 'uploading' && (
                      <LinearProgress 
                        variant="determinate" 
                        value={mediaFile.uploadProgress}
                        sx={{ mt: 0.5 }}
                      />
                    )}
                    {mediaFile.error && (
                      <Typography variant="caption" color="error">
                        {mediaFile.error}
                      </Typography>
                    )}
                  </Box>
                }
              />
              
              {mediaFile.preview && (
                <Box sx={{ mr: 1 }}>
                  <img 
                    src={mediaFile.preview} 
                    alt="Preview" 
                    style={{ 
                      width: 40, 
                      height: 40, 
                      objectFit: 'cover',
                      borderRadius: 4
                    }} 
                  />
                </Box>
              )}
              
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleRemoveFile(mediaFile.id)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>
    );
  };

  const renderUploadArea = () => {
    if (variant === 'icon' && children) {
      return (
        <Box onClick={() => fileInputRef.current?.click()}>
          {children}
        </Box>
      );
    }

    if (variant === 'button') {
      return (
        <Button
          variant="outlined"
          startIcon={<AttachIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          {children || 'Attach Files'}
        </Button>
      );
    }

    // Dropzone variant
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          borderStyle: 'dashed',
          borderWidth: 2,
          borderColor: dragActive ? 'primary.main' : 'divider',
          bgcolor: dragActive ? 'action.hover' : 'transparent',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: disabled ? 'divider' : 'primary.main',
            bgcolor: disabled ? 'transparent' : 'action.hover'
          }
        }}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <UploadIcon 
          sx={{ 
            fontSize: 48, 
            color: dragActive ? 'primary.main' : 'text.secondary',
            mb: 1
          }} 
        />
        
        <Typography variant="h6" gutterBottom>
          {dragActive ? 'Drop files here' : 'Upload Files'}
        </Typography>
        
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Drag and drop files here, or click to browse
        </Typography>
        
        <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Chip size="small" label={`Max ${maxFiles} files`} />
          <Chip size="small" label={`Up to ${maxFileSize}MB each`} />
        </Box>
        
        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
          Supported: {acceptedTypes.join(', ')}
        </Typography>
      </Paper>
    );
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
      
      {renderUploadArea()}
      
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
      
      {renderFileList()}
      
      {mediaFiles.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="textSecondary">
            {mediaFiles.length} file{mediaFiles.length !== 1 ? 's' : ''} selected
          </Typography>
          
          {onUploadComplete && (
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                // Simulate upload for demo
                mediaFiles.forEach(simulateUpload);
              }}
              disabled={mediaFiles.some(mf => mf.uploadStatus === 'uploading')}
            >
              Upload All
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default MediaUploader;
