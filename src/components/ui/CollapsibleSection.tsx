import React, { useState, ReactNode } from 'react';
import { Box, Typography, Paper, IconButton, Collapse } from '@mui/material';
import { ExpandMore, ChevronRight } from '@mui/icons-material';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  initialOpen?: boolean;
  titleVariant?: 'h5' | 'h6' | 'subtitle1'; // Allow title variant customization
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  initialOpen = false,
  titleVariant = 'h6',
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Paper 
      elevation={0} 
      sx={{
        mb: 2, 
        overflow: 'hidden',
        borderRadius: '0.75rem', // card style from HTML
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)', // Softer shadow-md
        backgroundColor: 'white',
      }}
    >
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        onClick={handleToggle}
        sx={{
          cursor: 'pointer', 
          p: {xs: 1.5, md: 2}, 
          borderBottom: isOpen ? 1 : 0, 
          borderColor: 'divider' 
        }}
      >
        <Typography 
            variant={titleVariant} 
            component="h3" // Semantic heading for the section title
            sx={{ 
                fontWeight: 600, // semibold from HTML for section titles
                color: '#374151', // gray-700 from HTML for section titles
                flexGrow: 1,
            }}
        >
          {title}
        </Typography>
        <IconButton size="small" aria-label={isOpen ? 'collapse section' : 'expand section'} sx={{ ml: 1 }}>
          {isOpen ? <ExpandMore /> : <ChevronRight />}
        </IconButton>
      </Box>
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <Box sx={{ p: {xs: 1.5, md: 2}, borderTop: 0, borderColor: 'divider' }}> {/* Ensure padding matches header if needed */}
          {children}
        </Box>
      </Collapse>
    </Paper>
  );
}; 