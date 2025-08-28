/**
 * SearchFilterPanel Component
 * 
 * Advanced search and filtering interface for comments and messages.
 * Supports text search, user filtering, date ranges, and content type filtering.
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Button,
  IconButton,
  Autocomplete,
  DatePicker,
  Divider,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  DateRange as DateIcon,
  Category as CategoryIcon,
  AttachFile as AttachmentIcon
} from '@mui/icons-material';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';

import { User } from '../../types/user';

export interface SearchFilters {
  query: string;
  users: User[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  contentTypes: string[];
  hasAttachments?: boolean;
  hasReactions?: boolean;
  isEdited?: boolean;
  tags: string[];
  sortBy: 'newest' | 'oldest' | 'relevance';
  sortOrder: 'asc' | 'desc';
}

interface SearchFilterPanelProps {
  /** Current search filters */
  filters: SearchFilters;
  /** Callback when filters change */
  onFiltersChange: (filters: SearchFilters) => void;
  /** Available users for filtering */
  availableUsers: User[];
  /** Available content types */
  availableContentTypes: string[];
  /** Available tags */
  availableTags: string[];
  /** Show advanced filters */
  showAdvanced?: boolean;
  /** Compact mode for smaller spaces */
  compact?: boolean;
  /** Placeholder text for search */
  searchPlaceholder?: string;
}

/**
 * SearchFilterPanel provides comprehensive search and filtering capabilities
 */
export const SearchFilterPanel: React.FC<SearchFilterPanelProps> = ({
  filters,
  onFiltersChange,
  availableUsers,
  availableContentTypes,
  availableTags,
  showAdvanced = true,
  compact = false,
  searchPlaceholder = "Search messages and comments..."
}) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const updateFilters = useCallback((updates: Partial<SearchFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  }, [filters, onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      query: '',
      users: [],
      dateRange: {},
      contentTypes: [],
      hasAttachments: undefined,
      hasReactions: undefined,
      isEdited: undefined,
      tags: [],
      sortBy: 'newest',
      sortOrder: 'desc'
    });
  }, [onFiltersChange]);

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.users.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.contentTypes.length > 0) count++;
    if (filters.hasAttachments !== undefined) count++;
    if (filters.hasReactions !== undefined) count++;
    if (filters.isEdited !== undefined) count++;
    if (filters.tags.length > 0) count++;
    return count;
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={filters.query}
          onChange={(e) => updateFilters({ query: e.target.value })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: filters.query && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => updateFilters({ query: '' })}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ flexGrow: 1 }}
        />
        
        <Badge badgeContent={getActiveFilterCount()} color="primary">
          <Tooltip title="Advanced Filters">
            <IconButton onClick={() => setAdvancedOpen(!advancedOpen)}>
              <FilterIcon />
            </IconButton>
          </Tooltip>
        </Badge>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      {/* Main Search Bar */}
      <TextField
        fullWidth
        placeholder={searchPlaceholder}
        value={filters.query}
        onChange={(e) => updateFilters({ query: e.target.value })}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: filters.query && (
            <InputAdornment position="end">
              <IconButton onClick={() => updateFilters({ query: '' })}>
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          )
        }}
        sx={{ mb: 2 }}
      />

      {/* Quick Filters */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.hasAttachments === true}
              onChange={(e) => updateFilters({ 
                hasAttachments: e.target.checked ? true : undefined 
              })}
            />
          }
          label="Has Attachments"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.hasReactions === true}
              onChange={(e) => updateFilters({ 
                hasReactions: e.target.checked ? true : undefined 
              })}
            />
          }
          label="Has Reactions"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.isEdited === true}
              onChange={(e) => updateFilters({ 
                isEdited: e.target.checked ? true : undefined 
              })}
            />
          }
          label="Edited"
        />
      </Box>

      {/* Active Filters Display */}
      {getActiveFilterCount() > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Active Filters ({getActiveFilterCount()}):
            </Typography>
            <Button size="small" onClick={clearAllFilters}>
              Clear All
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {filters.users.map((user) => (
              <Chip
                key={user.id}
                label={user.username}
                size="small"
                icon={<PersonIcon />}
                onDelete={() => updateFilters({
                  users: filters.users.filter(u => u.id !== user.id)
                })}
              />
            ))}
            
            {filters.contentTypes.map((type) => (
              <Chip
                key={type}
                label={type}
                size="small"
                icon={<CategoryIcon />}
                onDelete={() => updateFilters({
                  contentTypes: filters.contentTypes.filter(t => t !== type)
                })}
              />
            ))}
            
            {filters.tags.map((tag) => (
              <Chip
                key={tag}
                label={`#${tag}`}
                size="small"
                onDelete={() => updateFilters({
                  tags: filters.tags.filter(t => t !== tag)
                })}
              />
            ))}
            
            {(filters.dateRange.start || filters.dateRange.end) && (
              <Chip
                label={`${filters.dateRange.start ? format(filters.dateRange.start, 'MMM d') : '...'} - ${filters.dateRange.end ? format(filters.dateRange.end, 'MMM d') : '...'}`}
                size="small"
                icon={<DateIcon />}
                onDelete={() => updateFilters({ dateRange: {} })}
              />
            )}
          </Box>
        </Box>
      )}

      {/* Advanced Filters */}
      {showAdvanced && (
        <Accordion expanded={advancedOpen} onChange={() => setAdvancedOpen(!advancedOpen)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Advanced Filters</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              
              {/* User Filter */}
              <Autocomplete
                multiple
                options={availableUsers}
                getOptionLabel={(user) => user.username}
                value={filters.users}
                onChange={(_, users) => updateFilters({ users })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filter by Users"
                    placeholder="Select users..."
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((user, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={user.id}
                      label={user.username}
                      size="small"
                    />
                  ))
                }
              />

              {/* Content Type Filter */}
              <FormControl>
                <InputLabel>Content Types</InputLabel>
                <Select
                  multiple
                  value={filters.contentTypes}
                  onChange={(e) => updateFilters({ 
                    contentTypes: Array.isArray(e.target.value) ? e.target.value : []
                  })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {availableContentTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      <Checkbox checked={filters.contentTypes.includes(type)} />
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Date Range */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>Date Range</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <MuiDatePicker
                    label="From"
                    value={filters.dateRange.start}
                    onChange={(date) => updateFilters({
                      dateRange: { ...filters.dateRange, start: date || undefined }
                    })}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                  <MuiDatePicker
                    label="To"
                    value={filters.dateRange.end}
                    onChange={(date) => updateFilters({
                      dateRange: { ...filters.dateRange, end: date || undefined }
                    })}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                </Box>
              </Box>

              {/* Tags Filter */}
              <Autocomplete
                multiple
                freeSolo
                options={availableTags}
                value={filters.tags}
                onChange={(_, tags) => updateFilters({ tags })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tags"
                    placeholder="Add tags..."
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((tag, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={tag}
                      label={`#${tag}`}
                      size="small"
                    />
                  ))
                }
              />

              {/* Sort Options */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>Sort By</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={filters.sortBy}
                      onChange={(e) => updateFilters({ sortBy: e.target.value as any })}
                    >
                      <MenuItem value="newest">Newest</MenuItem>
                      <MenuItem value="oldest">Oldest</MenuItem>
                      <MenuItem value="relevance">Relevance</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={filters.sortOrder}
                      onChange={(e) => updateFilters({ sortOrder: e.target.value as any })}
                    >
                      <MenuItem value="desc">Desc</MenuItem>
                      <MenuItem value="asc">Asc</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      )}
    </Paper>
  );
};

export default SearchFilterPanel;
