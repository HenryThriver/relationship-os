'use client';

import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Button,
  Avatar,
  Chip,
  Paper,
  Link as MuiLink,
  CircularProgress,
  Alert,
  Fade,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LaunchIcon from '@mui/icons-material/Launch';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import BusinessIcon from '@mui/icons-material/Business';
import SchoolIcon from '@mui/icons-material/School';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star'; // For skills
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // For success alert
import InfoIcon from '@mui/icons-material/Info'; // For About section
import WorkIcon from '@mui/icons-material/Work'; // For Experience section
import MenuBookIcon from '@mui/icons-material/MenuBook'; // For Education section (SchoolIcon already used)
import LocalActivityIcon from '@mui/icons-material/LocalActivity'; // For Skills section (StarIcon already used)

import type { LinkedInArtifact, /* LinkedInArtifactContent, */ LinkedInSkill, LinkedInPosition as ArtifactLinkedInPosition, LinkedInEducation as ArtifactLinkedInEducation } from '@/types/artifact'; // Removed unused LinkedInArtifactContent
import { useLinkedInModal } from '@/lib/hooks/useLinkedInModal';
import { ArtifactSuggestions } from '@/components/features/suggestions/ArtifactSuggestions';
// import { useLinkedInModal } from '@/lib/hooks/useLinkedInModal'; // Will be created later

// Import Slide for modal transition
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';

// Transition component for the modal - KEEPING for potential future use, but not applying to Modal directly for now
const AnimatedSlide = React.forwardRef<
  unknown, 
  TransitionProps & { children: React.ReactElement } // Changed children type to React.ReactElement
>((props, ref) => {
  const { children, ...other } = props;
  return <Slide direction="up" ref={ref} {...other}>{children}</Slide>;
});
AnimatedSlide.displayName = 'AnimatedSlide';

interface LinkedInProfileModalProps {
  open: boolean;
  onClose: () => void;
  artifact: LinkedInArtifact;
  contactId?: string;
  contactName?: string; // For display if artifact doesn't have full name easily
  contactLinkedInUrl?: string; // <-- Add prop here
}

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '100%',
  maxWidth: {
    xs: '95vw',    
    sm: '90vw',    
    md: '800px',   
    lg: '850px',   
    xl: '900px'    
  },
  bgcolor: '#F0F2F5', // Changed to a lighter grey like LinkedIn's background
  boxShadow: '0 20px 60px rgba(0,0,0,0.15)', 
  borderRadius: '12px', // Slightly smaller border radius
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '90vh', // Increased max height
  margin: 'auto', 
  overflow: 'hidden', 
};

const headerBaseStyle = {
  height: '200px', // Increased height for banner
  position: 'relative' as const,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  color: 'white',
  borderRadius: '12px 12px 0 0', // Match modal border radius
  flexShrink: 0, // Prevent header from shrinking if content is too tall for modal maxHeight
};

const profilePictureStyle = {
  position: 'absolute',
  bottom: '20px', // Positioned from the bottom of the header
  left: '32px',
  width: '168px', // LinkedIn standard profile picture size
  height: '168px',
  border: '4px solid white', // White border like LinkedIn
  borderRadius: '50%',
  boxShadow: '0 4px 16px rgba(0,0,0,0.2)', // Enhanced shadow
  zIndex: 10,
  backgroundColor: '#0A66C2',
  fontSize: '72px', // Larger initials for larger avatar
  display: 'flex', 
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': {
    transform: 'scale(1.03)',
    transition: 'transform 0.2s ease-in-out',
  },
};

const contentWrapperStyle = {
  overflowY: 'auto',
  paddingTop: '20px', // Space below the header area before main content
  paddingLeft: { xs: '20px', sm: '30px', md: '32px' },
  paddingRight: { xs: '20px', sm: '30px', md: '32px' },
  paddingBottom: { xs: '30px', sm: '40px', md: '40px' }, // Increased bottom padding
  flexGrow: 1,
  backgroundColor: '#F0F2F5', // Consistent background
};

// Helper functions for date formatting (Item 3 from user query)
const formatDateToShortMonthYear = (dateString: string | undefined | null): string => {
  if (!dateString || dateString === "0" || dateString.toLowerCase() === "present") return "Present";
  
  // Attempt to parse various potential date formats from RapidAPI if they are not standard ISO
  // Example: "YYYY-MM-DD", "MM/YYYY", "YYYY", "Month YYYY"
  // For simplicity, assuming dateString is parseable by Date() or is in a format we specifically handle.
  // A more robust solution would involve a library like date-fns if formats are very inconsistent.
  
  let dateObj;
  // Check if it's just a year "YYYY"
  if (/^\d{4}$/.test(dateString)) {
    dateObj = new Date(parseInt(dateString), 0); // January of that year
  } 
  // Check for "MM/YYYY" or "M/YYYY"
  else if (/^\d{1,2}\/\d{4}$/.test(dateString)) {
    const parts = dateString.split('/');
    dateObj = new Date(parseInt(parts[1]), parseInt(parts[0]) - 1);
  } 
  // Try direct parsing for ISO-like dates or other recognizable formats
  else {
    dateObj = new Date(dateString);
  }

  if (isNaN(dateObj.getTime())) {
    return dateString; // Return original if parsing fails
  }
  
  return dateObj.toLocaleDateString('en-US', { 
    month: 'short', 
    year: 'numeric' 
  }); // e.g., "Sep 2023"
};

const formatEmploymentDatesDisplay = (startDateRaw: string | undefined | null, endDateRaw: string | undefined | null): string => {
  const start = formatDateToShortMonthYear(startDateRaw);
  let end = formatDateToShortMonthYear(endDateRaw);

  if (end.toLowerCase() === "present" || !endDateRaw || endDateRaw === "0") {
    end = "Present";
  }
  
  if (start === "Present" && end === "Present") return "Current"; // Or handle as error/empty
  if (start === "Present") return end; // Should not happen if start date is always there

  return `${start} - ${end}`;
};

const sectionStyle = { 
  mb: '24px',
  p: '24px',
  borderRadius: '16px', 
  backgroundColor: '#FFFFFF', 
  border: '1px solid #E0E0E0',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    transform: 'translateY(-2px)'
  }
};

export const LinkedInProfileModal: React.FC<LinkedInProfileModalProps> = ({
  open,
  onClose,
  artifact,
  contactId,
  contactName,
  contactLinkedInUrl,
}) => {
  const { rescrapeProfile, isLoading: isRescrapingHook, error: rescrapeErrorHook } = useLinkedInModal();
  const [rescrapeInitiated, setRescrapeInitiated] = useState(false);

  const metadata = artifact.metadata;
  
  const bannerUrl = metadata.backgroundImage?.[0]?.url;

  const dynamicHeaderStyle = {
    ...headerBaseStyle,
    backgroundImage: bannerUrl 
      ? `url(${bannerUrl})` 
      : 'linear-gradient(135deg, #0A66C2 0%, #004182 100%)', // Fallback gradient
    // Remove dot pattern if banner image exists
    ...(bannerUrl && {
      '&::before': { display: 'none' }, // Hide dot pattern if banner exists
      '&::after': { // Subtle shadow at the bottom of the banner
        content: '""',
        position: 'absolute',
        bottom: '-1px', 
        left: 0,
        right: 0, 
        height: '20px', // Increased height for a softer fade
        background: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.1))', 
        zIndex: 5, 
      }
    }),
    ...(!bannerUrl && { // Keep original gradient effects if no banner
      backgroundImage: `linear-gradient(135deg, #0A66C2 0%, #004182 100%), radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)`,
      backgroundSize: 'auto, 2.5px 2.5px',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: 'inherit', 
        boxShadow: 'inset 0px 2px 4px rgba(0,0,0,0.1), inset 0px -1px 2px rgba(0,0,0,0.05)',
        pointerEvents: 'none', 
        zIndex: 1, 
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: '-1px', 
        left: 0,
        right: 0, 
        height: '10px',
        background: 'linear-gradient(to bottom, rgba(0,65,130,0), #F0F2F5)', 
        zIndex: 5, 
      }
    })
  };
  
  const profileName = metadata.name || `${metadata.firstName || ''} ${metadata.lastName || ''}`.trim() || contactName || 'N/A';
  const profileHeadline = metadata.headline || 'No headline available';
  const profileAbout = metadata.about || 'No summary available.';
  const profileLocation = metadata.geo?.full || (metadata.geo?.city && metadata.geo?.country ? `${metadata.geo.city}, ${metadata.geo.country}` : metadata.location || 'Location not specified');

  const skillsToDisplay: LinkedInSkill[] = metadata.skills?.filter(skill => skill && skill.name).slice(0,15) || [];

  const handleRescrape = async () => {
    const urlToRescrape = metadata.profile_url || contactLinkedInUrl;
    if (!contactId || !urlToRescrape) {
      console.error('Missing contact ID or a usable profile URL (from metadata or contact) for rescraping.', { contactId, metaUrl: metadata.profile_url, contactUrl: contactLinkedInUrl });
      return;
    }
    setRescrapeInitiated(false);
    try {
      await rescrapeProfile(contactId, urlToRescrape);
      setRescrapeInitiated(true); 
    } catch (error: unknown) { // Changed to unknown
      if (error instanceof Error) {
        console.error("Rescrape failed:", error.message);
      } else {
        console.error("Rescrape failed with unknown error type:", error);
      }
      setRescrapeInitiated(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + (parts[parts.length - 1].charAt(0) || '')).toUpperCase();
  };
  
  // Removed console.log statements

  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      aria-labelledby="linkedin-profile-modal-title"
      sx={{ backdropFilter: 'blur(3px)' }} // Subtle backdrop blur
    >
      <Fade in={open} timeout={{ enter: 700, exit: 300 }}> 
        <Box sx={modalStyle}>
          <Box sx={dynamicHeaderStyle}> {/* Use dynamicHeaderStyle here */}
            <Avatar 
              src={metadata.profilePicture}
              alt={profileName}
              sx={{
                ...profilePictureStyle,
                ...( !metadata.profilePicture && {
                  background: 'linear-gradient(135deg, #0A66C2, #00BFA5)',
                  color: 'white',
                }),
              }}
            >
              {getInitials(profileName)}
              <Box sx={{
                position: 'absolute', 
                bottom: 10,
                right: 10,
                width: 16,
                height: 16,
                borderRadius: '50%', 
                backgroundColor: '#34D058',
                border: '2px solid white',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                zIndex: 2,
              }} />
            </Avatar>
            <IconButton 
              aria-label="close" 
              onClick={onClose} 
              sx={{ 
                position: 'absolute', top: 16, right: 16, 
                color: bannerUrl ? 'rgba(255,255,255,0.9)' : '#FFFFFF', // Adapts to banner
                backgroundColor: bannerUrl ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)', 
                '&:hover': {
                  backgroundColor: bannerUrl ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.2)',
                },
                zIndex: 1 // Ensure it's above banner but below other potential header elements
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={contentWrapperStyle}>
            <Box sx={{ // This is the Name, Headline, Location, View on LinkedIn block
              mt: '20px', 
              mb: 3, 
              pl: { xs: 0, md: 'calc(168px + 32px + 20px)' }, 
              minHeight: '100px', 
            }}>
              <Typography 
                variant="h1" 
                id="linkedin-profile-modal-title" 
                sx={{ fontSize: {xs: '1.8rem', sm: '2.2rem', md: '2.5rem'}, fontWeight: 700, color: '#000000', letterSpacing: '-0.02em', mb: 1, lineHeight: 1.1 }}
              >
                {profileName}
              </Typography>
              <Typography 
                variant="h2" 
                sx={{ fontSize: {xs: '1rem', md:'1.125rem'}, color: '#666666', lineHeight: 1.5, fontWeight: 400, mb: 2 }}
              >
                {profileHeadline}
              </Typography>
              {profileLocation && (
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: '#444444' }}>
                  <LocationOnIcon fontSize="small" sx={{color: '#666666'}}/> {profileLocation}
                </Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5}}>
                {metadata.profile_url && (
                  <MuiLink 
                    href={metadata.profile_url} target="_blank" rel="noopener noreferrer" variant="body2" 
                    sx={{ 
                      display: 'inline-flex', alignItems: 'center', fontWeight: '600', color: '#0A66C2', 
                      transition: 'all 0.2s ease-in-out',
                      textDecoration: 'none',
                      p: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(10, 102, 194, 0.05)',
                      '&:hover': { 
                        color: '#004182',
                        backgroundColor: 'rgba(10, 102, 194, 0.1)', 
                        textDecoration: 'underline',
                      } 
                    }}
                  >
                    View on LinkedIn <LaunchIcon fontSize="inherit" sx={{ ml: 0.5, fontSize:'0.875rem' }} />
                  </MuiLink>
                )}
                <Button
                  variant="text"
                  size="small"
                  startIcon={isRescrapingHook ? <CircularProgress size={14} color="inherit" /> : <AutorenewIcon sx={{fontSize: '1rem'}} />}
                  onClick={handleRescrape}
                  disabled={isRescrapingHook}
                  sx={{
                    color: '#0A66C2',
                    fontWeight: '600',
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(10, 102, 194, 0.05)',
                    '&:hover': {
                      backgroundColor: 'rgba(10, 102, 194, 0.1)',
                      textDecoration: 'underline',
                    }
                  }}
                >
                  {isRescrapingHook ? 'Updating...' : 'Update Profile'}
                </Button>
              </Box>
            </Box>
            
            {rescrapeErrorHook && 
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 2, mt: 1, borderRadius: '12px', 
                  background: 'linear-gradient(to right, #FFEBEE, #FFCDD2)',
                  border: '1px solid #E57373',
                  '& .MuiAlert-message': { color: '#B71C1C', fontWeight: '500'},
                  '& .MuiAlert-icon': { color: '#C62828 !important'}
                }}
              >
                {rescrapeErrorHook}
              </Alert>
            }
            {rescrapeInitiated && !isRescrapingHook && !rescrapeErrorHook && (
               <Alert 
                severity="success" 
                icon={<CheckCircleOutlineIcon sx={{ fontSize: '1.3rem' }} />}
                sx={{
                  mb: 2, mt: 1,
                  background: 'linear-gradient(to right, #D4F6DB, #E8F8EA)', 
                  border: '1px solid #34D058', 
                  borderRadius: '12px', 
                  padding: '12px 18px', 
                  '& .MuiAlert-message': { 
                    fontWeight: '500',
                    color: '#137B2D'
                  },
                  '& .MuiAlert-icon': { 
                    color: '#137B2D !important'
                  }
                }}
              >
                Profile update requested. Data will refresh shortly.
              </Alert>
            )}

            {/* AI Processing Status and Suggestions */}
            <Box sx={{ mb: 3 }}>
              <ArtifactSuggestions
                artifactId={artifact.id}
                artifactType="linkedin_profile"
                aiParsingStatus={artifact.ai_parsing_status as 'pending' | 'processing' | 'completed' | 'failed'}
                contactId={contactId}
                compact={false}
              />
            </Box>

            {/* About Section */}
            <Paper elevation={0} sx={{...sectionStyle, borderRadius: '8px' }}> {/* Consistent border radius */}
              <Typography 
                variant="h3"
                sx={{ fontSize: {xs: '1.1rem', md:'1.375rem'}, fontWeight: 600, color: '#000000', mb: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <InfoIcon sx={{ color: '#0A66C2' }} /> About
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: '#333333', lineHeight: 1.6, fontSize: '0.9rem' }}>
                {metadata.about && metadata.about.length > 0
                  ? (metadata.about.length > 350 ? metadata.about.substring(0, 350) + "..." : metadata.about)
                  : "No summary available."}
              </Typography>
            </Paper>

            {/* Experience Section */}
            {metadata.experience && metadata.experience.length > 0 && (
              <Paper elevation={0} sx={{...sectionStyle, borderRadius: '8px' }}> {/* Consistent border radius */}
                <Typography 
                  variant="h3"
                  sx={{ fontSize: {xs: '1.1rem', md:'1.375rem'}, fontWeight: 600, color: '#000000', mb: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <WorkIcon sx={{ color: '#0A66C2' }}/> Experience
                </Typography>
                {metadata.experience.map((exp: ArtifactLinkedInPosition, index: number) => (
                  <Box key={index} sx={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    gap: '20px',
                    py: '12px',
                    '&:not(:last-child)': { 
                      borderBottom: '1px solid transparent',
                    } 
                  }}>
                    <Avatar 
                      sx={{ 
                        background: 'linear-gradient(135deg, #0A66C2, #0077B5)', 
                        color: 'white', width: 56, height: 56, borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        flexShrink: 0
                      }} variant="rounded"
                    >
                      <BusinessIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" sx={{ fontSize: '16px', fontWeight: '600', lineHeight: '1.4', color: '#000000', mb: '4px' }}>{exp.title || 'N/A'}</Typography>
                      <Typography variant="body1" sx={{ fontSize: '14px', fontWeight: '500', color: '#0A66C2', mb: '4px' }}>{exp.companyName || exp.company || 'N/A'}</Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '13px',
                          color: exp.date2?.toLowerCase() === 'present' || !exp.date2 || exp.date2 === "0" ? '#0A66C2' : '#666666', 
                          fontWeight: exp.date2?.toLowerCase() === 'present' || !exp.date2 || exp.date2 === "0" ? '500' : 'normal',
                          mb: '8px',
                          display:'block' 
                        }}
                      >
                        {formatEmploymentDatesDisplay(exp.date1, exp.date2)}
                      </Typography>
                      {exp.description && <Typography variant="body2" sx={{ mt: 0, whiteSpace: 'pre-line', lineHeight: '1.5', color: '#333333', fontSize: '14px' }}>{exp.description}</Typography>}
                    </Box>
                  </Box>
                ))}
              </Paper>
            )}

            {/* Education Section */}
            {metadata.education && metadata.education.length > 0 && (
              <Paper elevation={0} sx={{...sectionStyle, borderRadius: '8px' }}> {/* Consistent border radius */}
                <Typography 
                  variant="h3"
                  sx={{ fontSize: {xs: '1.1rem', md:'1.375rem'}, fontWeight: 600, color: '#000000', mb: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <MenuBookIcon sx={{ color: '#0A66C2' }} /> Education
                </Typography>
                {metadata.education.map((edu: ArtifactLinkedInEducation, index: number) => (
                  <Box key={index} sx={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    gap: '20px',
                    py: '12px',
                    '&:not(:last-child)': { 
                      borderBottom: '1px solid transparent',
                    } 
                  }}>
                     <Avatar 
                      sx={{ 
                        background: 'linear-gradient(135deg, #0A66C2, #0077B5)',
                        color: 'white', width: 56, height: 56, borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        flexShrink: 0
                      }} variant="rounded"
                     >
                      <SchoolIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" sx={{ fontSize: '16px', fontWeight: '600', lineHeight: '1.4', color: '#000000', mb: '4px' }}>{edu.schoolName || edu.school || 'N/A'}</Typography>
                      <Typography variant="body1" sx={{ fontSize: '14px', fontWeight: '500', color: '#0A66C2', mb: '4px' }}>{edu.degreeName || edu.degree}{edu.field && `, ${edu.field}`}</Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '13px',
                          color: edu.date2?.toLowerCase() === 'present' || !edu.date2 || edu.date2 === "0" ? '#0A66C2' : '#666666', 
                          fontWeight: edu.date2?.toLowerCase() === 'present' || !edu.date2 || edu.date2 === "0" ? '500' : 'normal', 
                          mb: '8px',
                          display:'block'
                        }}
                      >
                        {formatEmploymentDatesDisplay(edu.date1, edu.date2)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Paper>
            )}
            
            {/* Skills Section */}
            {skillsToDisplay.length > 0 && (
              <Paper elevation={0} sx={{...sectionStyle, borderRadius: '8px' }}> {/* Consistent border radius */}
                <Typography 
                  variant="h3"
                  sx={{ fontSize: {xs: '1.1rem', md:'1.375rem'}, fontWeight: 600, color: '#000000', mb: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <LocalActivityIcon sx={{ color: '#0A66C2' }} /> Skills
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: {
                    xs: '1fr',                    
                    sm: 'repeat(2, 1fr)',         
                    md: 'repeat(3, 1fr)',         
                    lg: 'repeat(4, 1fr)'          
                  }, 
                  gap: '12px', 
                }}>
                  {skillsToDisplay.map((skill: LinkedInSkill, index: number) => (
                    <Chip 
                      key={index} 
                      label={skill.name} 
                      size="medium" 
                      icon={<StarIcon sx={{ color: '#0A66C2', fontSize: '16px' }}/>} 
                      sx={{ 
                        background: '#F3F2F0', 
                        border: '1px solid #E0E0E0',
                        borderRadius: '16px',
                        padding: '8px 12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#000000',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        justifyContent: 'flex-start', 
                        transition: 'all 0.2s ease-in-out',
                        height: 'auto',
                        minHeight: '36px',
                        '& .MuiChip-label': {
                          overflowWrap: 'break-word',
                          whiteSpace: 'normal',
                          textAlign: 'left',
                          paddingRight: 0,
                        },
                        '&:hover': {
                          background: '#E7F3FF',
                          borderColor: '#0A66C2',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                        },
                        '& .MuiChip-icon': { 
                          color: '#0A66C2',
                          fontSize: '16px',
                        },
                      }}
                    />
                  ))}
                </Box>
                 {skillsToDisplay.length === 0 && <Typography variant="body2" sx={{color: '#666666', fontSize: '0.9rem'}}>No skills listed.</Typography>}
              </Paper>
            )}

            {/* Fallback for missing data */}
            {(!metadata.experience || metadata.experience.length === 0) &&
             (!metadata.education || metadata.education.length === 0) &&
             (!skillsToDisplay || skillsToDisplay.length === 0) &&
             (!profileAbout || profileAbout === "No summary available.") &&
              <Paper elevation={0} sx={{...sectionStyle, backgroundColor: 'transparent', border: 'none', boxShadow: 'none', borderRadius: '8px' }}>
                <Typography variant="body1" color="text.secondary" textAlign="center" sx={{p:2, borderRadius: '12px', background: 'rgba(0,0,0,0.03)'}}>
                  Detailed profile information is not available in this artifact.
                  Try updating the profile to fetch the latest data.
                </Typography>
              </Paper>
            }
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}; 