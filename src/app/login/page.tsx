'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function LoginRedirectPage(): React.JSX.Element {
  const router = useRouter();

  useEffect(() => {
    // Preserve query parameters during redirect
    const searchParams = new URLSearchParams(window.location.search);
    const queryString = searchParams.toString();
    const redirectUrl = queryString ? `/auth/login?${queryString}` : '/auth/login';
    
    router.replace(redirectUrl);
  }, [router]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography variant="body1" color="text.secondary">
        Redirecting to login...
      </Typography>
    </Box>
  );
}