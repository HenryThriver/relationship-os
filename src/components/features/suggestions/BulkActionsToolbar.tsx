'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Checkbox, 
  FormControlLabel,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  CheckCircle as ApplyIcon,
  Cancel as RejectIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onApplySelected: () => void;
  onRejectSelected: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  totalCount,
  onApplySelected,
  onRejectSelected,
  onSelectAll,
  onClearSelection,
  disabled = false,
  isLoading = false
}) => {
  const allSelected = selectedCount === totalCount && totalCount > 0;
  const someSelected = selectedCount > 0 && selectedCount < totalCount;
  const noneSelected = selectedCount === 0;

  const handleSelectAllChange = () => {
    if (allSelected || someSelected) {
      onClearSelection();
    } else {
      onSelectAll();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        backgroundColor: 'grey.50',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'grey.200',
        mb: 2
      }}
    >
      {/* Selection controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={handleSelectAllChange}
              disabled={disabled || totalCount === 0}
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              Select All
            </Typography>
          }
        />
        
        <Divider orientation="vertical" flexItem />
        
        <Typography variant="body2" color="text.secondary">
          Selected: <strong>{selectedCount}</strong> of <strong>{totalCount}</strong>
        </Typography>
      </Box>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {selectedCount > 0 && (
          <>
            <Button
              variant="outlined"
              size="small"
              startIcon={isLoading ? <CircularProgress size={16} /> : <RejectIcon />}
              onClick={onRejectSelected}
              disabled={disabled || isLoading || noneSelected}
              color="error"
              sx={{ textTransform: 'none' }}
            >
              Reject Selected
            </Button>
            
            <Button
              variant="contained"
              size="small"
              startIcon={isLoading ? <CircularProgress size={16} /> : <ApplyIcon />}
              onClick={onApplySelected}
              disabled={disabled || isLoading || noneSelected}
              color="primary"
              sx={{ textTransform: 'none' }}
            >
              Apply Selected ({selectedCount})
            </Button>
          </>
        )}
        
        {selectedCount > 0 && (
          <Button
            variant="text"
            size="small"
            startIcon={<ClearIcon />}
            onClick={onClearSelection}
            disabled={disabled || isLoading}
            sx={{ textTransform: 'none', ml: 1 }}
          >
            Clear
          </Button>
        )}
      </Box>
    </Box>
  );
}; 