/**
 * RichTextEditor Component
 * 
 * Rich text editor component with formatting toolbar, media support,
 * and markdown compatibility for comments and messages.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Divider,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Menu,
  MenuItem,
  Typography,
  Chip,
  Alert
} from '@mui/material';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatStrikethrough as StrikethroughIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as NumberListIcon,
  FormatQuote as QuoteIcon,
  Code as CodeIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  FormatClear as ClearFormatIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  maxHeight?: number;
  showToolbar?: boolean;
  allowMarkdown?: boolean;
  allowImages?: boolean;
  allowLinks?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
  mentionUsers?: Array<{ id: number; username: string; displayName: string }>;
  onMention?: (userId: number) => void;
}

interface EditorCommand {
  command: string;
  value?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Type your message...',
  disabled = false,
  minHeight = 120,
  maxHeight = 300,
  showToolbar = true,
  allowMarkdown = true,
  allowImages = true,
  allowLinks = true,
  onImageUpload,
  mentionUsers = [],
  onMention
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [formatStates, setFormatStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Update format states when selection changes
  useEffect(() => {
    const updateFormatStates = () => {
      if (!editorRef.current || !focused) return;

      setFormatStates({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikethrough: document.queryCommandState('strikeThrough')
      });
    };

    document.addEventListener('selectionchange', updateFormatStates);
    return () => document.removeEventListener('selectionchange', updateFormatStates);
  }, [focused]);

  const executeCommand = useCallback((command: string, value?: string) => {
    if (!editorRef.current) return;

    editorRef.current.focus();
    document.execCommand(command, false, value);
    
    // Update content after command
    const content = editorRef.current.innerHTML;
    onChange(content);
  }, [onChange]);

  const handleFormat = (format: string) => {
    const commands: Record<string, EditorCommand> = {
      bold: { command: 'bold' },
      italic: { command: 'italic' },
      underline: { command: 'underline' },
      strikethrough: { command: 'strikeThrough' },
      bulletList: { command: 'insertUnorderedList' },
      numberList: { command: 'insertOrderedList' },
      quote: { command: 'formatBlock', value: 'blockquote' },
      code: { command: 'formatBlock', value: 'pre' },
      undo: { command: 'undo' },
      redo: { command: 'redo' },
      clear: { command: 'removeFormat' }
    };

    const cmd = commands[format];
    if (cmd) {
      executeCommand(cmd.command, cmd.value);
    }
  };

  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!onImageUpload) return;

    try {
      setError(null);
      const imageUrl = await onImageUpload(file);
      executeCommand('insertImage', imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    const content = event.currentTarget.innerHTML;
    onChange(content);

    // Handle mentions
    const text = event.currentTarget.textContent || '';
    const lastAtIndex = text.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const afterAt = text.substring(lastAtIndex + 1);
      if (!afterAt.includes(' ') && afterAt.length > 0) {
        setMentionQuery(afterAt.toLowerCase());
        setShowMentions(true);
      } else if (afterAt.length === 0) {
        setMentionQuery('');
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (user: { id: number; username: string; displayName: string }) => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection) return;

    // Replace the @query with @username
    const range = selection.getRangeAt(0);
    const textContent = editorRef.current.textContent || '';
    const lastAtIndex = textContent.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // Create new range to select from @ to current position
      const newRange = document.createRange();
      const walker = document.createTreeWalker(
        editorRef.current,
        NodeFilter.SHOW_TEXT
      );
      
      let currentPos = 0;
      let node;
      
      while (node = walker.nextNode()) {
        const nodeLength = node.textContent?.length || 0;
        if (currentPos + nodeLength > lastAtIndex) {
          newRange.setStart(node, lastAtIndex - currentPos);
          break;
        }
        currentPos += nodeLength;
      }
      
      newRange.setEnd(range.endContainer, range.endOffset);
      newRange.deleteContents();
      
      // Insert mention
      const mentionElement = document.createElement('span');
      mentionElement.className = 'mention';
      mentionElement.setAttribute('data-user-id', user.id.toString());
      mentionElement.textContent = `@${user.username}`;
      mentionElement.style.backgroundColor = '#e3f2fd';
      mentionElement.style.color = '#1976d2';
      mentionElement.style.padding = '2px 4px';
      mentionElement.style.borderRadius = '4px';
      mentionElement.style.fontSize = '0.875rem';
      
      newRange.insertNode(mentionElement);
      
      // Add space after mention
      const spaceNode = document.createTextNode(' ');
      mentionElement.parentNode?.insertBefore(spaceNode, mentionElement.nextSibling);
      
      // Move cursor after space
      const newSelection = window.getSelection();
      if (newSelection) {
        newSelection.removeAllRanges();
        const cursorRange = document.createRange();
        cursorRange.setStartAfter(spaceNode);
        cursorRange.collapse(true);
        newSelection.addRange(cursorRange);
      }
    }

    setShowMentions(false);
    onMention?.(user.id);
    
    // Update content
    const content = editorRef.current.innerHTML;
    onChange(content);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'b':
          event.preventDefault();
          handleFormat('bold');
          break;
        case 'i':
          event.preventDefault();
          handleFormat('italic');
          break;
        case 'u':
          event.preventDefault();
          handleFormat('underline');
          break;
        case 'z':
          event.preventDefault();
          handleFormat(event.shiftKey ? 'redo' : 'undo');
          break;
      }
    }

    // Handle mention navigation
    if (showMentions) {
      if (event.key === 'Escape') {
        setShowMentions(false);
      }
    }
  };

  const filteredMentions = mentionUsers.filter(user =>
    user.username.toLowerCase().includes(mentionQuery) ||
    user.displayName.toLowerCase().includes(mentionQuery)
  );

  const renderToolbar = () => {
    if (!showToolbar) return null;

    return (
      <Box sx={{ 
        p: 1, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'wrap'
      }}>
        {/* Format Buttons */}
        <ToggleButtonGroup size="small" exclusive={false}>
          <ToggleButton
            value="bold"
            selected={formatStates.bold}
            onChange={() => handleFormat('bold')}
            disabled={disabled}
          >
            <Tooltip title="Bold (Ctrl+B)">
              <BoldIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
          
          <ToggleButton
            value="italic"
            selected={formatStates.italic}
            onChange={() => handleFormat('italic')}
            disabled={disabled}
          >
            <Tooltip title="Italic (Ctrl+I)">
              <ItalicIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
          
          <ToggleButton
            value="underline"
            selected={formatStates.underline}
            onChange={() => handleFormat('underline')}
            disabled={disabled}
          >
            <Tooltip title="Underline (Ctrl+U)">
              <UnderlineIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
          
          <ToggleButton
            value="strikethrough"
            selected={formatStates.strikethrough}
            onChange={() => handleFormat('strikethrough')}
            disabled={disabled}
          >
            <Tooltip title="Strikethrough">
              <StrikethroughIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem />

        {/* List Buttons */}
        <IconButton
          size="small"
          onClick={() => handleFormat('bulletList')}
          disabled={disabled}
        >
          <Tooltip title="Bullet List">
            <BulletListIcon fontSize="small" />
          </Tooltip>
        </IconButton>

        <IconButton
          size="small"
          onClick={() => handleFormat('numberList')}
          disabled={disabled}
        >
          <Tooltip title="Numbered List">
            <NumberListIcon fontSize="small" />
          </Tooltip>
        </IconButton>

        <IconButton
          size="small"
          onClick={() => handleFormat('quote')}
          disabled={disabled}
        >
          <Tooltip title="Quote">
            <QuoteIcon fontSize="small" />
          </Tooltip>
        </IconButton>

        <IconButton
          size="small"
          onClick={() => handleFormat('code')}
          disabled={disabled}
        >
          <Tooltip title="Code Block">
            <CodeIcon fontSize="small" />
          </Tooltip>
        </IconButton>

        <Divider orientation="vertical" flexItem />

        {/* Insert Buttons */}
        {allowLinks && (
          <IconButton
            size="small"
            onClick={handleLink}
            disabled={disabled}
          >
            <Tooltip title="Insert Link">
              <LinkIcon fontSize="small" />
            </Tooltip>
          </IconButton>
        )}

        {allowImages && onImageUpload && (
          <>
            <IconButton
              size="small"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              <Tooltip title="Insert Image">
                <ImageIcon fontSize="small" />
              </Tooltip>
            </IconButton>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </>
        )}

        <Divider orientation="vertical" flexItem />

        {/* Action Buttons */}
        <IconButton
          size="small"
          onClick={() => handleFormat('undo')}
          disabled={disabled}
        >
          <Tooltip title="Undo (Ctrl+Z)">
            <UndoIcon fontSize="small" />
          </Tooltip>
        </IconButton>

        <IconButton
          size="small"
          onClick={() => handleFormat('redo')}
          disabled={disabled}
        >
          <Tooltip title="Redo (Ctrl+Shift+Z)">
            <RedoIcon fontSize="small" />
          </Tooltip>
        </IconButton>

        <IconButton
          size="small"
          onClick={() => handleFormat('clear')}
          disabled={disabled}
        >
          <Tooltip title="Clear Formatting">
            <ClearFormatIcon fontSize="small" />
          </Tooltip>
        </IconButton>
      </Box>
    );
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Paper
        variant="outlined"
        sx={{
          borderColor: focused ? 'primary.main' : 'divider',
          borderWidth: focused ? 2 : 1,
          borderRadius: 1,
          overflow: 'hidden'
        }}
      >
        {renderToolbar()}
        
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ m: 1 }}>
            {error}
          </Alert>
        )}

        <Box
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={handleInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          sx={{
            minHeight,
            maxHeight,
            overflowY: 'auto',
            p: 2,
            outline: 'none',
            '&:empty::before': {
              content: `"${placeholder}"`,
              color: 'text.disabled',
              fontStyle: 'italic'
            },
            '& .mention': {
              backgroundColor: '#e3f2fd',
              color: '#1976d2',
              padding: '2px 4px',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 500
            },
            '& blockquote': {
              borderLeft: 4,
              borderColor: 'primary.main',
              pl: 2,
              ml: 0,
              fontStyle: 'italic',
              color: 'text.secondary'
            },
            '& pre': {
              backgroundColor: 'grey.100',
              p: 1,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              overflow: 'auto'
            },
            '& img': {
              maxWidth: '100%',
              height: 'auto',
              borderRadius: 1
            },
            '& a': {
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }
          }}
          dangerouslySetInnerHTML={{ __html: value }}
        />
      </Paper>

      {/* Mention Suggestions */}
      {showMentions && filteredMentions.length > 0 && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            mb: 1,
            maxHeight: 200,
            overflow: 'auto',
            zIndex: 1000
          }}
        >
          <Box sx={{ p: 1 }}>
            <Typography variant="caption" color="textSecondary">
              Mention someone
            </Typography>
          </Box>
          {filteredMentions.map((user) => (
            <Box
              key={user.id}
              sx={{
                p: 1,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
              onClick={() => handleMentionSelect(user)}
            >
              <Typography variant="body2">
                @{user.username}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {user.displayName}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default RichTextEditor;
