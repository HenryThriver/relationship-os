'use client';

import React, { useState, useCallback } from 'react';
import { useSourceAttribution, SourceInfo } from '@/lib/hooks/useSourceAttribution';
import { Tooltip, Box, Chip, IconButton, CircularProgress, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

// Import Icons (these will be referenced by SOURCE_CONFIG)
// import MicIcon from '@mui/icons-material/Mic'; // No longer directly needed here
// ... other icon imports also not directly needed here

import { SOURCE_CONFIG } from '@/config/sourceConfig'; // Import the new config

// --- SOURCE_TYPES Configuration --- (This whole block will be removed)
/*
export const SOURCE_TYPES: Record<string, {
  icon: React.ElementType;
  color: string;
  label: string;
  // route pattern is handled in the hook for now
}> = {
  voice_memo: {
    icon: MicIcon,
    color: '#2196f3', // Blue
    label: 'Voice Memo',
  },
  linkedin_profile: {
    icon: LinkedInIcon,
    color: '#0077b5', // LinkedIn Blue
    label: 'LinkedIn Profile',
  },
  email: {
    icon: EmailIcon,
    color: '#ea4335', // Red
    label: 'Email',
  },
  meeting: {
    icon: EventIcon,
    color: '#4caf50', // Green
    label: 'Meeting Notes',
  },
  note: {
    icon: NoteIcon,
    color: '#ff9800', // Orange
    label: 'Manual Note',
  },
  default: {
    icon: InfoOutlinedIcon,
    color: '#9e9e9e', // Grey
    label: 'Source',
  }
  // Add more as artifact types expand
};
*/

// --- SourceTooltip Component ---
interface SourceTooltipProps {
  sourceInfo: SourceInfo;
  onNavigate: () => void;
  contactId: string; // Needed to pass to navigateToSource from the hook
}

const StyledTooltipContent = styled('div')(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? '#424242' : '#333',
  color: 'white',
  padding: '12px',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  maxWidth: '320px',
  fontSize: '14px',
}));

const TooltipHeader = styled('div')({
  fontWeight: 'bold',
  marginBottom: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

const TooltipExcerpt = styled('div')({
  fontStyle: 'italic',
  opacity: 0.9,
  fontSize: '12px',
  margin: '8px 0',
  maxHeight: '60px', // Limit excerpt height
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const TooltipAction = styled('div')({
  fontSize: '11px',
  opacity: 0.8,
  borderTop: '1px solid #555',
  paddingTop: '8px',
  marginTop: '8px',
  cursor: 'pointer',
  '&:hover': {
    opacity: 1,
  }
});

const SourceTooltip: React.FC<SourceTooltipProps> = ({ sourceInfo, onNavigate }) => {
  const config = SOURCE_CONFIG[sourceInfo.artifactType as string] || SOURCE_CONFIG.default;
  const IconComponent = config.icon;

  return (
    <StyledTooltipContent>
      <TooltipHeader>
        <IconComponent sx={{ fontSize: 18, color: config.color }} />
        {config.label}: {sourceInfo.title || 'Details'}
      </TooltipHeader>
      <Typography variant="caption" display="block" sx={{ opacity: 0.7 }}>
        Sourced on: {new Date(sourceInfo.timestamp).toLocaleDateString()}
      </Typography>
      {sourceInfo.excerpt && (
        <TooltipExcerpt>
          Excerpt: {sourceInfo.excerpt}
        </TooltipExcerpt>
      )}
      <TooltipAction onClick={onNavigate}>
        Click to view source artifact
      </TooltipAction>
    </StyledTooltipContent>
  );
};

// --- SourcedField Component ---
interface SourcedFieldProps {
  fieldPath: string;
  contactId: string;
  children: React.ReactNode;
  showIndicator?: boolean; 
  compact?: boolean; 
  className?: string; // Allow passing a className for external styling
}

const SourcedFieldWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'showIndicator' && prop !== 'sourceColor' && prop !== 'hasSource' && prop !== 'isTooltipOpen'
})<{
  showIndicator?: boolean;
  sourceColor?: string;
  hasSource?: boolean;
  isTooltipOpen?: boolean;
}>(({ theme, showIndicator, sourceColor, hasSource, isTooltipOpen }) => ({
  position: 'relative',
  display: 'inline-block', // Or 'block' depending on desired layout with children
  paddingLeft: showIndicator && hasSource && isTooltipOpen ? theme.spacing(0.5) : 0,
  marginLeft: showIndicator && hasSource && isTooltipOpen ? theme.spacing(0.5) : 0,
  borderLeft: showIndicator && hasSource && isTooltipOpen ? `3px solid ${sourceColor || theme.palette.divider}` : 'none',
  transition: 'background-color 0.2s ease-in-out',
  cursor: hasSource ? 'pointer' : 'default',
  '&:hover': {
    backgroundColor: hasSource ? theme.palette.action.hover : 'transparent',
  },
}));

const CompactSourceIcon = styled(IconButton)({
  padding: '2px',
  position: 'absolute',
  top: '-8px',
  right: '-8px',
  backgroundColor: 'rgba(255,255,255,0.8)',
  '&:hover': {
    backgroundColor: 'rgba(255,255,255,1)',
  }
});

export const SourcedField: React.FC<SourcedFieldProps> = ({
  fieldPath,
  contactId,
  children,
  showIndicator = true,
  compact = false,
  className,
}) => {
  const { getSourceInfo, navigateToSource, isLoadingArtifact, isLoadingContact } = useSourceAttribution(contactId);
  const [sourceInfo, setSourceInfo] = useState<SourceInfo | null>(null);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  // Fetch source info when fieldPath or contactId changes, or on demand
  // For now, let's fetch it when the component might become visible or on hover trigger
  // A more optimized approach might be to fetch all sources once at a higher level.

  const handleFetchSourceInfo = useCallback(async () => {
    if (!sourceInfo && !isLoadingContact) { // Only fetch if not already fetched
      const info = await getSourceInfo(fieldPath);
      setSourceInfo(info);
    }
  }, [getSourceInfo, fieldPath, sourceInfo, isLoadingContact]);

  const handleNavigate = () => {
    if (sourceInfo) {
      navigateToSource(sourceInfo.artifactId, sourceInfo.artifactType);
    }
  };
  
  // Use SOURCE_CONFIG here
  const sourceConfig = sourceInfo ? (SOURCE_CONFIG[sourceInfo.artifactType as string] || SOURCE_CONFIG.default) : null;
  const IconComponent = sourceConfig?.icon;

  const tooltipTitle = sourceInfo ? (
    <SourceTooltip 
      sourceInfo={sourceInfo} 
      onNavigate={handleNavigate} 
      contactId={contactId} 
    />
  ) : (
    isLoadingArtifact || isLoadingContact ? <CircularProgress size={20} /> : 'No source information available'
  );

  return (
    <Tooltip 
      title={tooltipTitle} 
      arrow 
      placement="top-start"
      open={sourceInfo ? isTooltipOpen : false} // Control tooltip visibility based on fetched sourceInfo
      onOpen={() => { 
        handleFetchSourceInfo(); // Fetch info when tooltip tries to open
        setIsTooltipOpen(true);
      }}
      onClose={() => setIsTooltipOpen(false)}
      PopperProps={{
        sx: { 
          // Ensure tooltip content uses our styled component
          '& .MuiTooltip-tooltip': {
            backgroundColor: 'transparent', 
            padding: 0, 
            maxWidth: 'none', 
            boxShadow: 'none' 
          }
        }
      }}
    >
      <SourcedFieldWrapper
        className={className}
        onClick={sourceInfo ? handleNavigate : undefined} // Navigate only if source is available
        showIndicator={showIndicator}
        sourceColor={sourceConfig?.color}
        hasSource={!!sourceInfo}
        isTooltipOpen={isTooltipOpen}
        onMouseEnter={handleFetchSourceInfo} // Pre-fetch on mouse enter for faster tooltip
      >
        {children}
        {/* Always show icon-only for less intrusiveness, differentiate style if needed based on compact */} 
        {sourceInfo && IconComponent && isTooltipOpen && (
          <IconButton 
            size="small" 
            onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
            sx={{
              padding: compact ? '2px' : '4px', // Slightly larger padding if not compact
              position: 'absolute',
              top: compact ? '-8px' : '-10px', // Adjust position based on compact
              right: compact ? '-8px' : '-10px',
              backgroundColor: 'rgba(255,255,255,0.8)',
              zIndex: 1, // Ensure it's above other elements if overlap occurs
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,1)',
              }
            }}
          >
            <IconComponent sx={{ fontSize: compact ? 14 : 16, color: sourceConfig?.color }} />
          </IconButton>
        )}
        {/* {!compact && sourceInfo && IconComponent && isTooltipOpen && (
           <Chip 
             icon={<IconComponent />} 
             label={sourceConfig?.label} 
             size="small" 
             sx={{ 
                position:'absolute', 
                top: -10, right: -10, 
                backgroundColor: sourceConfig?.color, 
                color: 'white',
                opacity: 0.8,
                '&:hover': { opacity: 1}
            }}
            onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
            />
        )} */}
      </SourcedFieldWrapper>
    </Tooltip>
  );
}; 