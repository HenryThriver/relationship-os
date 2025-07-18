'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Stack,
  AppBar,
  Toolbar,
  alpha,
} from '@mui/material';
import { Google as GoogleIcon, ArrowBack } from '@mui/icons-material';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';

export default function LoginPage(): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleGoogleSignIn = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await signInWithGoogle();
      
      if (error) {
        setError(error.message);
      }
      // Note: If successful, the OAuth flow will redirect to Google
      // and then back to our callback URL
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <Container maxWidth="sm">
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
          <Typography>Redirecting to dashboard...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          backgroundColor: 'transparent',
          borderBottom: '1px solid',
          borderColor: 'grey.200'
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ py: 1 }}>
            <Button
              component={Link}
              href="/"
              startIcon={<ArrowBack />}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: 'transparent'
                }
              }}
            >
              Back to home
            </Button>
            
            <Typography
              variant="h6"
              sx={{
                flexGrow: 1,
                textAlign: 'center',
                color: 'text.primary',
                fontWeight: 600,
                letterSpacing: '-0.02em'
              }}
            >
              Cultivate HQ
            </Typography>
            
            <Box sx={{ width: 120 }} /> {/* Balance the back button */}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main Content */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          py: 4,
          background: `linear-gradient(135deg, ${alpha('#2196F3', 0.02)} 0%, ${alpha('#7C3AED', 0.02)} 100%)`
        }}
      >
        <Container maxWidth="sm">
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Card
              sx={{
                width: '100%',
                maxWidth: 500,
                p: 4,
                border: '1px solid',
                borderColor: 'grey.200',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                backgroundColor: 'white'
              }}
            >
              <CardContent sx={{ p: 0 }}>
                <Stack spacing={4}>
                  {/* Header */}
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography 
                      variant="h4" 
                      component="h1" 
                      gutterBottom
                      sx={{
                        fontWeight: 600,
                        letterSpacing: '-0.02em',
                        fontSize: { xs: '1.75rem', md: '2rem' }
                      }}
                    >
                      Welcome back
                    </Typography>
                    <Typography 
                      variant="h6" 
                      component="h2" 
                      color="primary" 
                      gutterBottom
                      sx={{
                        fontWeight: 500,
                        fontSize: '1.25rem'
                      }}
                    >
                      Cultivate HQ
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{
                        fontSize: '1.125rem',
                        lineHeight: 1.4,
                        maxWidth: 350,
                        mx: 'auto'
                      }}
                    >
                      Continue your journey toward systematic relationship mastery
                    </Typography>
                  </Box>

                  {/* Error Alert */}
                  {error && (
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                      {error}
                    </Alert>
                  )}

                  {/* Sign In Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    sx={{
                      py: 2,
                      textTransform: 'none',
                      fontSize: '1.125rem',
                      fontWeight: 500,
                      minHeight: 56,
                      transform: 'scale(1)',
                      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'scale(1.02)',
                      }
                    }}
                  >
                    {loading ? 'Signing in...' : 'Continue with Google'}
                  </Button>

                  {/* New User Link */}
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      New to Cultivate HQ?
                    </Typography>
                    <Button
                      component={Link}
                      href="/pricing"
                      variant="outlined"
                      sx={{
                        textTransform: 'none',
                        fontWeight: 500,
                        borderWidth: 1.5,
                        px: 3,
                        '&:hover': {
                          borderWidth: 1.5,
                        }
                      }}
                    >
                      Get started
                    </Button>
                  </Box>

                  {/* Legal */}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      lineHeight: 1.4,
                      px: 2,
                    }}
                  >
                    By continuing, you agree to our Terms of Service and Privacy Policy
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </Box>
    </Box>
  );
} 