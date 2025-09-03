/**
 * MediaViewer Component
 * 
 * Modal media viewer with support for images, videos, and documents.
 * Features zoom, fullscreen, and navigation for multiple media items.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Toolbar,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Download as DownloadIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  FitScreen as FitScreenIcon
} from '@mui/icons-material';

import { MediaAttachment } from '../../types/media';
import { mediaService } from '../../services/mediaService';

interface MediaViewerProps {
  open: boolean;
  onClose: () => void;
  media: MediaAttachment[];
  initialIndex?: number;
  showNavigation?: boolean;
  showDownload?: boolean;
  showFullscreen?: boolean;
}

interface MediaViewState {
  currentIndex: number;
  zoom: number;
  rotation: number;
  position: { x: number; y: number };
  isFullscreen: boolean;
  loading: boolean;
  error: string | null;
  mediaUrl: string | null;
}

const MediaViewer: React.FC<MediaViewerProps> = ({
  open,
  onClose,
  media,
  initialIndex = 0,
  showNavigation = true,
  showDownload = true,
  showFullscreen = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [viewState, setViewState] = useState<MediaViewState>({
    currentIndex: initialIndex,
    zoom: 1,
    rotation: 0,
    position: { x: 0, y: 0 },
    isFullscreen: false,
    loading: false,
    error: null,
    mediaUrl: null
  });

  const currentMedia = media[viewState.currentIndex];

  // Load media URL when media changes
  useEffect(() => {
    if (currentMedia && open) {
      loadMediaUrl(currentMedia);
    }
  }, [currentMedia, open]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setViewState(prev => ({
        ...prev,
        currentIndex: initialIndex,
        zoom: 1,
        rotation: 0,
        position: { x: 0, y: 0 },
        error: null
      }));
    }
  }, [open, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (showNavigation && media.length > 1) {
            navigateMedia(-1);
          }
          break;
        case 'ArrowRight':
          if (showNavigation && media.length > 1) {
            navigateMedia(1);
          }
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        case '0':
          resetZoom();
          break;
        case 'f':
        case 'F11':
          event.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, showNavigation, media.length]);

  const loadMediaUrl = async (mediaItem: MediaAttachment) => {
    setViewState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const url = await mediaService.getMediaUrl(mediaItem.id);
      setViewState(prev => ({ ...prev, mediaUrl: url, loading: false }));
    } catch (error) {
      setViewState(prev => ({ 
        ...prev, 
        error: 'Failed to load media',
        loading: false 
      }));
    }
  };

  const navigateMedia = (direction: number) => {
    const newIndex = viewState.currentIndex + direction;
    if (newIndex >= 0 && newIndex < media.length) {
      setViewState(prev => ({
        ...prev,
        currentIndex: newIndex,
        zoom: 1,
        rotation: 0,
        position: { x: 0, y: 0 }
      }));
    }
  };

  const zoomIn = () => {
    setViewState(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.2, 5)
    }));
  };

  const zoomOut = () => {
    setViewState(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.2, 0.1)
    }));
  };

  const resetZoom = () => {
    setViewState(prev => ({
      ...prev,
      zoom: 1,
      position: { x: 0, y: 0 }
    }));
  };

  const rotateLeft = () => {
    setViewState(prev => ({
      ...prev,
      rotation: prev.rotation - 90
    }));
  };

  const rotateRight = () => {
    setViewState(prev => ({
      ...prev,
      rotation: prev.rotation + 90
    }));
  };

  const toggleFullscreen = () => {
    if (viewState.isFullscreen) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.();
    }
    setViewState(prev => ({
      ...prev,
      isFullscreen: !prev.isFullscreen
    }));
  };

  const handleDownload = async () => {
    if (currentMedia) {
      try {
        await mediaService.downloadMedia(currentMedia.id);
      } catch (error) {
        console.error('Download failed:', error);
      }
    }
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (viewState.zoom <= 1) return;

    const startX = event.clientX - viewState.position.x;
    const startY = event.clientY - viewState.position.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setViewState(prev => ({
        ...prev,
        position: {
          x: moveEvent.clientX - startX,
          y: moveEvent.clientY - startY
        }
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    
    if (event.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderMediaContent = () => {
    if (viewState.loading) {
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '60vh'
        }}>
          <CircularProgress />
        </Box>
      );
    }

    if (viewState.error) {
      return (
        <Box sx={{ p: 4 }}>
          <Alert severity="error">
            {viewState.error}
          </Alert>
        </Box>
      );
    }

    if (!currentMedia || !viewState.mediaUrl) return null;

    const isImage = currentMedia.mime_type.startsWith('image/');
    const isVideo = currentMedia.mime_type.startsWith('video/');
    const isAudio = currentMedia.mime_type.startsWith('audio/');

    const mediaStyle = {
      transform: `scale(${viewState.zoom}) rotate(${viewState.rotation}deg) translate(${viewState.position.x}px, ${viewState.position.y}px)`,
      transition: viewState.zoom === 1 ? 'transform 0.2s ease' : 'none',
      cursor: viewState.zoom > 1 ? 'grab' : 'default',
      maxWidth: '100%',
      maxHeight: '80vh',
      objectFit: 'contain' as const
    };

    if (isImage) {
      return (
        <Box
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            overflow: 'hidden',
            height: '80vh'
          }}
          onWheel={handleWheel}
        >
          <img
            src={viewState.mediaUrl}
            alt={currentMedia.filename}
            style={mediaStyle}
            onMouseDown={handleMouseDown}
            draggable={false}
          />
        </Box>
      );
    }

    if (isVideo) {
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '80vh'
        }}>
          <video
            src={viewState.mediaUrl}
            controls
            style={{
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          />
        </Box>
      );
    }

    if (isAudio) {
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column',
          height: '60vh',
          gap: 2
        }}>
          <Typography variant="h6">
            {currentMedia.filename}
          </Typography>
          <audio src={viewState.mediaUrl} controls />
        </Box>
      );
    }

    // Document/other file types
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        height: '60vh',
        gap: 2
      }}>
        <Typography variant="h6">
          {currentMedia.filename}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {formatFileSize(currentMedia.file_size)} • {currentMedia.mime_type}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          This file type cannot be previewed. Click download to view.
        </Typography>
      </Box>
    );
  };

  const renderToolbar = () => (
    <Toolbar sx={{ 
      justifyContent: 'space-between',
      bgcolor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      minHeight: 'auto !important',
      py: 1
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle1" noWrap>
          {currentMedia?.filename}
        </Typography>
        {media.length > 1 && (
          <Chip
            size="small"
            label={`${viewState.currentIndex + 1} of ${media.length}`}
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
          />
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {/* Navigation */}
        {showNavigation && media.length > 1 && (
          <>
            <IconButton
              onClick={() => navigateMedia(-1)}
              disabled={viewState.currentIndex === 0}
              sx={{ color: 'white' }}
            >
              <PrevIcon />
            </IconButton>
            <IconButton
              onClick={() => navigateMedia(1)}
              disabled={viewState.currentIndex === media.length - 1}
              sx={{ color: 'white' }}
            >
              <NextIcon />
            </IconButton>
          </>
        )}

        {/* Image controls */}
        {currentMedia?.mime_type.startsWith('image/') && (
          <>
            <IconButton onClick={zoomOut} sx={{ color: 'white' }}>
              <ZoomOutIcon />
            </IconButton>
            <IconButton onClick={resetZoom} sx={{ color: 'white' }}>
              <FitScreenIcon />
            </IconButton>
            <IconButton onClick={zoomIn} sx={{ color: 'white' }}>
              <ZoomInIcon />
            </IconButton>
            <IconButton onClick={rotateLeft} sx={{ color: 'white' }}>
              <RotateLeftIcon />
            </IconButton>
            <IconButton onClick={rotateRight} sx={{ color: 'white' }}>
              <RotateRightIcon />
            </IconButton>
          </>
        )}

        {/* Download */}
        {showDownload && (
          <Tooltip title="Download">
            <IconButton onClick={handleDownload} sx={{ color: 'white' }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Fullscreen */}
        {showFullscreen && !isMobile && (
          <Tooltip title={viewState.isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>
              {viewState.isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Close */}
        <IconButton onClick={onClose} sx={{ color: 'white', ml: 1 }}>
          <CloseIcon />
        </IconButton>
      </Box>
    </Toolbar>
  );

  if (!currentMedia) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          bgcolor: 'black',
          color: 'white',
          maxHeight: '100vh',
          m: isMobile ? 0 : 2
        }
      }}
    >
      {renderToolbar()}
      
      <DialogContent sx={{ p: 0, bgcolor: 'black' }}>
        {renderMediaContent()}
        
        {/* Media info */}
        <Box sx={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0,
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          p: 2
        }}>
          <Typography variant="body2" color="inherit">
            {formatFileSize(currentMedia.file_size)} • {currentMedia.mime_type}
          </Typography>
          {currentMedia.uploaded_at && (
            <Typography variant="caption" color="inherit" sx={{ opacity: 0.8 }}>
              Uploaded {new Date(currentMedia.uploaded_at).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default MediaViewer;
