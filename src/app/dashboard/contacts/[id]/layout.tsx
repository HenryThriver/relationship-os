'use client';

import React from 'react';
import { Box, Container, Tabs, Tab } from '@mui/material';
import { useParams, usePathname, useRouter } from 'next/navigation';

// It might be beneficial to also fetch and display a minimal ContactHeader here
// so it's consistently above the tabs for both overview and timeline.
// For now, following the provided plan which has ContactHeader within each page.

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const contactId = params.id as string;
  
  // Determine current tab based on URL segment
  // Example: /contacts/[id] -> Overview (0)
  //          /contacts/[id]/timeline -> Timeline (1)
  let currentTab = 0;
  if (pathname && contactId) {
    const routeSegment = pathname.split(`/dashboard/contacts/${contactId}`)[1];
    if (routeSegment === '/timeline') {
      currentTab = 1;
    } else if (routeSegment === '/edit') { // Example for a future edit tab
      // currentTab = 2; 
    }
    // Add more else if for other potential tabs
  }
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    let route = '';
    switch (newValue) {
      case 0:
        route = `/dashboard/contacts/${contactId}`;
        break;
      case 1:
        route = `/dashboard/contacts/${contactId}/timeline`;
        break;
      // Add cases for other tabs
      default:
        route = `/dashboard/contacts/${contactId}`;
    }
    router.push(route);
  };

  return (
    // Using Container here might be redundant if pages themselves use Container.
    // Let's keep it for now for overall padding, can be adjusted.
    <Container maxWidth="lg" sx={{ pt: 2, pb:4 }}> 
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="Contact specific navigation tabs">
          <Tab label="Overview" id="contact-tab-0" aria-controls="contact-tabpanel-0" />
          <Tab label="Timeline" id="contact-tab-1" aria-controls="contact-tabpanel-1" />
          {/* Example for future: <Tab label="Edit Profile" /> */}
        </Tabs>
      </Box>
      {/* Each page (children) will render its content below the tabs */}
      {/* Each page will also render its own ContactHeader if needed (as per current plan for ContactTimelinePage) */}
      {/* Alternatively, a shared ContactHeader could be fetched and rendered here, above the Tabs. */}
      {children}
    </Container>
  );
} 